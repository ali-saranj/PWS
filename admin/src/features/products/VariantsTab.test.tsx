import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '../../i18n'
import type { ProductDetailDto, VariantDto } from '../../api/types'
import { server } from '../../test/server'
import { VariantsTab } from './VariantsTab'

const variant: VariantDto = {
  id: 9, version: 4, sku: 'WHEY-1', flavourFa: 'وانیل', flavourEn: 'Vanilla', sizeLabel: '2kg', weightGrams: 2000,
  basePrice: 12000000, compareAtPrice: 15000000, stockOnHand: 7, lowStockThreshold: 5, active: true, sortOrder: 2, tiers: [],
}

function product(): ProductDetailDto {
  return {
    id: 5, version: 1, brandId: 1, categoryId: 1, slug: 'p', nameFa: 'پ', nameEn: 'P', descriptionFa: null, descriptionEn: null,
    status: 'DRAFT', featured: false, seoTitleFa: null, seoTitleEn: null, seoDescriptionFa: null, seoDescriptionEn: null,
    images: [], variants: [variant],
  }
}

let gets = 0
function setup() {
  gets = 0
  server.use(http.get('/api/admin/products/5', () => { gets++; return HttpResponse.json(product()) }))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <VariantsTab productId={5} />
    </QueryClientProvider>,
  )
}

beforeEach(() => void i18n.changeLanguage('en'))

describe('VariantsTab edit', () => {
  it('round-trips prices as Toman and sends exact Rials with version and sortOrder, no initialStock', async () => {
    let body: unknown = null
    server.use(
      http.put('/api/admin/variants/9', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(variant)
      }),
    )
    setup()
    await userEvent.click(await screen.findByRole('button', { name: 'Edit WHEY-1' }))
    const price = screen.getByLabelText('Price (Toman)')
    expect(price).toHaveValue('1200000')
    expect(screen.getByLabelText('Compare-at price (Toman)')).toHaveValue('1500000')
    expect(screen.queryByLabelText('Initial stock')).not.toBeInTheDocument()
    await userEvent.clear(price)
    await userEvent.type(price, '1100000')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toEqual({
      sku: 'WHEY-1', flavourFa: 'وانیل', flavourEn: 'Vanilla', sizeLabel: '2kg', weightGrams: 2000,
      basePrice: 11000000, compareAtPrice: 15000000, lowStockThreshold: 5, active: true, sortOrder: 2, version: 4,
    })
  })

  it('409 CONFLICT shows the error with Reload, which refetches the product and closes the dialog', async () => {
    server.use(
      http.put('/api/admin/variants/9', () =>
        HttpResponse.json({ code: 'CONFLICT', messages: { fa: 'تعارض', en: 'Variant was changed' } }, { status: 409 }),
      ),
    )
    setup()
    await userEvent.click(await screen.findByRole('button', { name: 'Edit WHEY-1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Variant was changed')).toBeInTheDocument()
    const before = gets
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(gets).toBeGreaterThan(before)
  })
})
