import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import type { InventoryRowDto, Page } from '../../api/types'
import { renderRoutes } from '../../test/renderRoutes'
import { server } from '../../test/server'

const owner = { id: 1, username: 'owner', fullName: 'Main Owner', role: 'OWNER' as const }

function row(id: number, over: Partial<InventoryRowDto> = {}): InventoryRowDto {
  return {
    variantId: id, productId: 100 + id, productNameFa: `محصول ${id}`, productNameEn: `Product ${id}`,
    sku: `SKU-${id}`, flavourFa: null, flavourEn: 'Vanilla', sizeLabel: '1kg',
    stockOnHand: 10, lowStockThreshold: 3, active: true, ...over,
  }
}
const page = (items: InventoryRowDto[]): Page<InventoryRowDto> => ({ items, page: 0, size: 20, total: items.length })

describe('InventoryPage', () => {
  it('batch submits only non-zero deltas', async () => {
    let body: unknown
    server.use(
      http.get('/api/admin/inventory', () => HttpResponse.json(page([row(1), row(2), row(3)]))),
      http.post('/api/admin/inventory/adjustments', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json([row(1), row(3)])
      }),
    )
    renderRoutes('/inventory', owner)
    await userEvent.type(await screen.findByLabelText('Adjust SKU-1'), '+۵')
    await userEvent.type(screen.getByLabelText('Adjust SKU-2'), '0')
    await userEvent.type(screen.getByLabelText('Adjust SKU-3'), '-2')
    await userEvent.type(screen.getByLabelText('Note for all changes'), 'recount')
    await userEvent.click(screen.getByRole('button', { name: 'Apply 2 changes' }))
    await waitFor(() =>
      expect(body).toEqual({
        adjustments: [
          { variantId: 1, delta: 5, note: 'recount' },
          { variantId: 3, delta: -2, note: 'recount' },
        ],
      }),
    )
    // pending cleared after success
    await waitFor(() => expect(screen.queryByRole('button', { name: /Apply/ })).not.toBeInTheDocument())
    expect(screen.getByLabelText('Adjust SKU-1')).toHaveValue('')
  })

  it('STOCK_NEGATIVE error highlights the offending row and keeps the entered values', async () => {
    server.use(
      http.get('/api/admin/inventory', () => HttpResponse.json(page([row(1), row(2)]))),
      http.post('/api/admin/inventory/adjustments', () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_FAILED',
            messages: { fa: 'نامعتبر', en: 'Invalid' },
            errors: [{ field: 'adjustments[1].delta', code: 'STOCK_NEGATIVE', message: 'Stock cannot go negative' }],
          },
          { status: 400 },
        ),
      ),
    )
    renderRoutes('/inventory', owner)
    await userEvent.type(await screen.findByLabelText('Adjust SKU-1'), '1')
    await userEvent.type(screen.getByLabelText('Adjust SKU-2'), '-50')
    await userEvent.click(screen.getByRole('button', { name: 'Apply 2 changes' }))
    expect(await screen.findByText('Stock cannot go negative')).toBeInTheDocument()
    expect(screen.getByLabelText('Adjust SKU-2')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Adjust SKU-1')).not.toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Adjust SKU-1')).toHaveValue('1')
    expect(screen.getByLabelText('Adjust SKU-2')).toHaveValue('-50')
    expect(within(screen.getByTestId('inventory-row-2')).getByText('Stock cannot go negative')).toBeInTheDocument()
  })

  it('low-stock toggle sets lowStock=true', async () => {
    const seen: (string | null)[] = []
    server.use(
      http.get('/api/admin/inventory', ({ request }) => {
        seen.push(new URL(request.url).searchParams.get('lowStock'))
        return HttpResponse.json(page([row(1, { stockOnHand: 2 })]))
      }),
    )
    renderRoutes('/inventory', owner)
    await screen.findByLabelText('Adjust SKU-1')
    expect(seen[0]).toBeNull()
    await userEvent.click(screen.getByRole('switch', { name: 'Low stock only' }))
    await waitFor(() => expect(seen).toContain('true'))
  })

  it('opens the movement history drawer with localised reasons and a dash for system entries', async () => {
    server.use(
      http.get('/api/admin/inventory', () => HttpResponse.json(page([row(1)]))),
      http.get('/api/admin/variants/1/movements', () =>
        HttpResponse.json({
          items: [
            { id: 2, delta: -1, reason: 'ORDER_PAID', note: null, staffUsername: null, createdAt: '2026-10-25T10:00:00Z' },
            { id: 1, delta: 10, reason: 'MANUAL_ADJUSTMENT', note: 'first count', staffUsername: 'owner', createdAt: '2026-10-24T10:00:00Z' },
          ],
          page: 0, size: 20, total: 2,
        }),
      ),
    )
    renderRoutes('/inventory', owner)
    await userEvent.click(await screen.findByRole('button', { name: 'History SKU-1' }))
    expect(await screen.findByText('Order paid')).toBeInTheDocument()
    expect(screen.getByText('Manual adjustment')).toBeInTheDocument()
    expect(screen.getByText('first count')).toBeInTheDocument()
    expect(screen.getByText('Oct 25, 2026')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})

describe('InventoryPage fixes', () => {
  it('renders the apply bar outside the Card so it can stick to the viewport', async () => {
    server.use(http.get('/api/admin/inventory', () => HttpResponse.json(page([row(1)]))))
    renderRoutes('/inventory', owner)
    await userEvent.type(await screen.findByLabelText('Adjust SKU-1'), '1')
    const bar = screen.getByTestId('apply-bar')
    expect(bar.closest('.MuiCard-root')).toBeNull()
  })

  it('never shows another variant history while loading, and starts at page 0', async () => {
    const requests: string[] = []
    server.use(
      http.get('/api/admin/inventory', () => HttpResponse.json(page([row(1), row(2)]))),
      http.get('/api/admin/variants/:id/movements', async ({ params, request }) => {
        requests.push(`${params.id}:${new URL(request.url).searchParams.get('page')}`)
        if (params.id === '2') await new Promise((r) => setTimeout(r, 300))
        return HttpResponse.json({
          items: [{ id: 1, delta: 1, reason: 'INITIAL', note: `note-of-${params.id}`, staffUsername: 'owner', createdAt: '2026-10-24T10:00:00Z' }],
          page: 0, size: 20, total: 1,
        })
      }),
    )
    renderRoutes('/inventory', owner)
    await userEvent.click(await screen.findByRole('button', { name: 'History SKU-1' }))
    expect(await screen.findByText('note-of-1')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByText('note-of-1')).not.toBeInTheDocument())
    await userEvent.click(await screen.findByRole('button', { name: 'History SKU-2' }))
    expect(screen.queryByText('note-of-1')).not.toBeInTheDocument()
    expect(await screen.findByText('note-of-2')).toBeInTheDocument()
    expect(requests).toEqual(['1:0', '2:0'])
  })

  it('names the SKU of an off-page row whose adjustment failed', async () => {
    server.use(
      http.get('/api/admin/inventory', ({ request }) => {
        const pg = Number(new URL(request.url).searchParams.get('page') ?? 0)
        return HttpResponse.json({ items: [row(pg + 1)], page: pg, size: 20, total: 40 })
      }),
      http.post('/api/admin/inventory/adjustments', () =>
        HttpResponse.json(
          { code: 'VALIDATION_FAILED', messages: { fa: 'x', en: 'Invalid' }, errors: [{ field: 'adjustments[0].delta', code: 'STOCK_NEGATIVE', message: 'Stock cannot go negative' }] },
          { status: 400 },
        ),
      ),
    )
    renderRoutes('/inventory', owner)
    await userEvent.type(await screen.findByLabelText('Adjust SKU-1'), '-99')
    await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }))
    await screen.findByLabelText('Adjust SKU-2')
    await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))
    expect(await screen.findByText('SKU-1: Stock cannot go negative')).toBeInTheDocument()
  })
})
