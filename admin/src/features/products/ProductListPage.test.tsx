import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ProductSummaryDto } from '../../api/types'
import { renderRoutes } from '../../test/renderRoutes'
import { server } from '../../test/server'

const owner = { id: 1, username: 'owner', fullName: 'Main Owner', role: 'OWNER' as const }

function row(id: number, over: Partial<ProductSummaryDto> = {}): ProductSummaryDto {
  return {
    id, nameFa: `محصول ${id}`, nameEn: `Product ${id}`, slug: `p-${id}`, status: 'ACTIVE', brandId: 7, categoryId: 2,
    thumbnailUrl: null, variantCount: 1, minPrice: 1_500_000, totalStock: 4, updatedAt: '2026-10-01T00:00:00Z', ...over,
  }
}

beforeEach(() => {
  server.use(
    http.get('/api/admin/categories', () =>
      HttpResponse.json([{ id: 2, parentId: null, nameFa: 'پروتئین', nameEn: 'Protein', slug: 'protein', sortOrder: 0, active: true }]),
    ),
    http.get('/api/admin/brands', () =>
      HttpResponse.json([{ id: 7, nameFa: 'اپتیموم', nameEn: 'Optimum', slug: 'optimum', logoUrl: null, active: true }]),
    ),
  )
})

describe('ProductListPage', () => {
  it('list reads filters from URL and shows status chips', async () => {
    const seen: URLSearchParams[] = []
    server.use(
      http.get('/api/admin/products', ({ request }) => {
        seen.push(new URL(request.url).searchParams)
        return HttpResponse.json({
          items: [row(1), row(2, { status: 'DRAFT', minPrice: null }), row(3, { status: 'ARCHIVED' })],
          page: 1, size: 50, total: 120,
        })
      }),
    )
    renderRoutes('/products?q=whey&status=ACTIVE&categoryId=2&brandId=7&page=1&size=50', owner)
    expect(await screen.findByText('Product 1')).toBeInTheDocument()
    expect(Object.fromEntries(seen[0])).toEqual({ q: 'whey', status: 'ACTIVE', categoryId: '2', brandId: '7', page: '1', size: '50' })
    const table = within(screen.getByRole('table'))
    expect(table.getByText('Active')).toBeInTheDocument()
    expect(table.getByText('Draft')).toBeInTheDocument()
    expect(table.getByText('Archived')).toBeInTheDocument()
    expect(table.getAllByText('150,000 Toman')).toHaveLength(2)
    expect(table.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Active')
    expect(screen.getByLabelText('Search')).toHaveValue('whey')
  })

  it('changing a filter updates the URL and resets the page', async () => {
    server.use(
      http.get('/api/admin/products', () => HttpResponse.json({ items: [row(1)], page: 2, size: 20, total: 100 })),
    )
    const { router } = renderRoutes('/products?page=2', owner)
    await screen.findByText('Product 1')
    await userEvent.click(screen.getByRole('combobox', { name: 'Status' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Draft' }))
    await waitFor(() => expect(router.state.location.search).toBe('?status=DRAFT'))
  })
})
