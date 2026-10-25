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
