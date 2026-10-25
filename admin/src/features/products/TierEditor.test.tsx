import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '../../i18n'
import type { VariantDto } from '../../api/types'
import { server } from '../../test/server'
import { TierEditor } from './TierEditor'
import { VariantDialog } from './VariantDialog'

const variant: VariantDto = {
  id: 9, version: 2, sku: 'WHEY-1', flavourFa: null, flavourEn: 'Vanilla', sizeLabel: '2kg', weightGrams: 2000,
  basePrice: 10000000, compareAtPrice: null, stockOnHand: 4, lowStockThreshold: 5, active: true, sortOrder: 0, tiers: [],
}

function wrap(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => void i18n.changeLanguage('en'))

describe('TierEditor', () => {
  it('sends Rials (Toman x 10) to API', async () => {
    let body: unknown = null
    server.use(
      http.put('/api/admin/variants/9/tiers', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(variant)
      }),
    )
    wrap(<TierEditor productId={5} variant={variant} onClose={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Add tier' }))
    await userEvent.type(screen.getByLabelText('Minimum quantity 1'), '3')
    await userEvent.type(screen.getByLabelText('Unit price (Toman) 1'), '900000')
    expect(screen.getByTestId('tier-example')).toHaveTextContent('10 units → 900,000 Toman each')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(body).toEqual({ tiers: [{ minQty: 3, unitPrice: 9000000 }] }))
  })

  it('blocks client-side rule violations without calling the API', async () => {
    wrap(<TierEditor productId={5} variant={variant} onClose={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Add tier' }))
    await userEvent.type(screen.getByLabelText('Minimum quantity 1'), '1')
    await userEvent.type(screen.getByLabelText('Unit price (Toman) 1'), '900000')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText(/at least 2/)).toBeInTheDocument()
  })

  it('maps server TIER_INVALID errors to the right row', async () => {
    server.use(
      http.put('/api/admin/variants/9/tiers', () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_FAILED',
            messages: { fa: 'خطا', en: 'Validation failed' },
            errors: [{ field: 'tiers[1].unitPrice', code: 'TIER_INVALID', message: 'bad' }],
          },
          { status: 400 },
        ),
      ),
    )
    wrap(<TierEditor productId={5} variant={variant} onClose={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Add tier' }))
    await userEvent.click(screen.getByRole('button', { name: 'Add tier' }))
    await userEvent.type(screen.getByLabelText('Minimum quantity 1'), '2')
    await userEvent.type(screen.getByLabelText('Unit price (Toman) 1'), '900000')
    await userEvent.type(screen.getByLabelText('Minimum quantity 2'), '5')
    await userEvent.type(screen.getByLabelText('Unit price (Toman) 2'), '800000')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByLabelText('Unit price (Toman) 2')).toBeInvalid()
    expect(screen.getByLabelText('Unit price (Toman) 1')).toBeValid()
    expect(screen.getByLabelText('Minimum quantity 2')).toBeValid()
  })
})

describe('VariantDialog', () => {
  it('accepts Persian digits for price and stock', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post('/api/admin/products/5/variants', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(variant, { status: 201 })
      }),
    )
    wrap(<VariantDialog productId={5} variant={null} onClose={() => {}} />)
    await userEvent.type(screen.getByLabelText('SKU'), 'NEW-1')
    await userEvent.type(screen.getByLabelText('Price (Toman)'), '۱۲۰۰۰')
    await userEvent.type(screen.getByLabelText('Initial stock'), '۷')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(body).toMatchObject({ sku: 'NEW-1', basePrice: 120000, initialStock: 7 }))
  })

  it('maps basePrice TIER_INVALID to the price field with a tiers hint', async () => {
    server.use(
      http.put('/api/admin/variants/9', () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_FAILED',
            messages: { fa: 'خطا', en: 'Validation failed' },
            errors: [{ field: 'basePrice', code: 'TIER_INVALID', message: 'x' }],
          },
          { status: 400 },
        ),
      ),
    )
    wrap(<VariantDialog productId={5} variant={variant} onClose={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText(/Adjust the tiers first/)).toBeInTheDocument()
    expect(screen.getByLabelText('Price (Toman)')).toBeInvalid()
  })
})
