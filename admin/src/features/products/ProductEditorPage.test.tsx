import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import type { BrandDto, CategoryDto, ProductDetailDto } from '../../api/types'
import { renderRoutes } from '../../test/renderRoutes'
import { server } from '../../test/server'

const owner = { id: 1, username: 'owner', fullName: 'Main Owner', role: 'OWNER' as const }
const categories: CategoryDto[] = [
  { id: 1, parentId: null, nameFa: 'مکمل', nameEn: 'Supplements', slug: 'supplements', sortOrder: 0, active: true },
  { id: 2, parentId: 1, nameFa: 'پروتئین', nameEn: 'Protein', slug: 'protein', sortOrder: 0, active: true },
]
const brands: BrandDto[] = [{ id: 7, nameFa: 'اپتیموم', nameEn: 'Optimum', slug: 'optimum', logoUrl: null, active: true }]

function detail(over: Partial<ProductDetailDto> = {}): ProductDetailDto {
  return {
    id: 5, version: 3, brandId: 7, categoryId: 2, slug: 'gold-whey', nameFa: 'وی گلد', nameEn: 'Gold Whey',
    descriptionFa: null, descriptionEn: null, status: 'DRAFT', featured: false, seoTitleFa: null, seoTitleEn: null,
    seoDescriptionFa: null, seoDescriptionEn: null, images: [], variants: [], ...over,
  }
}

const problem = (status: number, code: string, en: string) =>
  HttpResponse.json({ code, messages: { fa: 'خطا', en } }, { status })

beforeEach(() => {
  server.use(
    http.get('/api/admin/categories', () => HttpResponse.json(categories)),
    http.get('/api/admin/brands', () => HttpResponse.json(brands)),
  )
})

describe('ProductEditorPage', () => {
  it('create navigates to /products/:id', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post('/api/admin/products', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(detail(), { status: 201 })
      }),
      http.get('/api/admin/products/5', () => HttpResponse.json(detail())),
    )
    const { router } = renderRoutes('/products/new', owner)
    await userEvent.type(await screen.findByLabelText('Persian name'), 'وی گلد')
    await userEvent.type(screen.getByLabelText('English name'), 'Gold Whey')
    expect(screen.getByLabelText('Slug')).toHaveValue('gold-whey')
    expect(screen.getByRole('tab', { name: 'Variants' })).toBeDisabled()
    await userEvent.click(screen.getByRole('combobox', { name: 'Category' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Protein' }))
    await userEvent.click(screen.getByRole('combobox', { name: 'Brand' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Optimum' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/products/5'))
    expect(body).toMatchObject({ brandId: 7, categoryId: 2, slug: 'gold-whey', nameFa: 'وی گلد', nameEn: 'Gold Whey' })
    expect(body).not.toHaveProperty('version')
    expect(await screen.findByRole('tab', { name: 'Variants' })).toBeEnabled()
  })

  it('409 CONFLICT on save shows reload prompt; reload refetches and keeps the editor open', async () => {
    let server_ = detail()
    const puts: Record<string, unknown>[] = []
    server.use(
      http.get('/api/admin/products/5', () => HttpResponse.json(server_)),
      http.put('/api/admin/products/5', async ({ request }) => {
        puts.push((await request.json()) as Record<string, unknown>)
        return puts.length <= 2 ? problem(409, 'CONFLICT', 'Stale version') : HttpResponse.json(server_)
      }),
    )
    const { router } = renderRoutes('/products/5', owner)
    const nameFa = await screen.findByLabelText('Persian name')
    await userEvent.clear(nameFa)
    await userEvent.type(nameFa, 'ویرایش من')
    server_ = detail({ version: 4, nameFa: 'نام سرور' })
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/changed by someone else/)).toBeInTheDocument()
    expect(puts[0]).toMatchObject({ version: 3 })

    // Cancel keeps the user's edits.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByLabelText('Persian name')).toHaveValue('ویرایش من')

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Reload' }))
    await waitFor(() => expect(screen.getByLabelText('Persian name')).toHaveValue('نام سرور'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(router.state.location.pathname).toBe('/products/5')

    // The reloaded form carries the new version, so the next save uses it.
    await userEvent.type(screen.getByLabelText('English name'), '!')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(puts).toHaveLength(3))
    expect(puts[2]).toMatchObject({ version: 4 })
  })

  it('failed reload keeps the dialog open, shows the error and keeps edits', async () => {
    let fail = false
    server.use(
      http.get('/api/admin/products/5', () => (fail ? problem(500, 'INTERNAL_ERROR', 'Server exploded') : HttpResponse.json(detail()))),
      http.put('/api/admin/products/5', () => problem(409, 'CONFLICT', 'Stale version')),
    )
    renderRoutes('/products/5', owner)
    const nameFa = await screen.findByLabelText('Persian name')
    await userEvent.clear(nameFa)
    await userEvent.type(nameFa, 'ویرایش من')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    const dialog = await screen.findByRole('dialog')
    fail = true
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reload' }))
    expect(await within(dialog).findByText('Server exploded')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByLabelText('Persian name')).toHaveValue('ویرایش من')
  })

  it('shows a server field error on the description editor', async () => {
    server.use(
      http.get('/api/admin/products/5', () => HttpResponse.json(detail())),
      http.put('/api/admin/products/5', () =>
        HttpResponse.json(
          { code: 'VALIDATION_FAILED', messages: { fa: 'خطا', en: 'Invalid' }, errors: [{ field: 'descriptionFa', code: 'INVALID', message: 'Description is bad' }] },
          { status: 400 },
        ),
      ),
    )
    renderRoutes('/products/5', owner)
    await userEvent.type(await screen.findByLabelText('English name'), 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Description is bad')).toBeInTheDocument()
  })

  it('PRODUCT_NOT_PUBLISHABLE shows its message', async () => {
    server.use(
      http.get('/api/admin/products/5', () => HttpResponse.json(detail())),
      http.post('/api/admin/products/5/status', async ({ request }) => {
        expect(await request.json()).toEqual({ status: 'ACTIVE', version: 3 })
        return problem(400, 'PRODUCT_NOT_PUBLISHABLE', 'Add an active variant first')
      }),
    )
    renderRoutes('/products/5', owner)
    await userEvent.click(await screen.findByRole('button', { name: 'Publish' }))
    expect(await screen.findByText('Add an active variant first')).toBeInTheDocument()
  })

  it('SEO title counter warns above 70 chars', async () => {
    server.use(http.get('/api/admin/products/5', () => HttpResponse.json(detail())))
    renderRoutes('/products/5', owner)
    await userEvent.click(await screen.findByRole('tab', { name: 'SEO' }))
    const title = screen.getByLabelText('SEO title (English)')
    await userEvent.click(title)
    await userEvent.paste('a'.repeat(70))
    expect(screen.getByTestId('seoTitleEn-counter')).toHaveTextContent('70/70')
    expect(screen.queryByText(/over the limit/)).not.toBeInTheDocument()
    await userEvent.type(title, 'b')
    expect(screen.getByTestId('seoTitleEn-counter')).toHaveTextContent('71/70')
    expect(screen.getByText(/over the limit/)).toBeInTheDocument()
  })

  it('unsaved changes prompt on navigation', async () => {
    server.use(http.get('/api/admin/products/5', () => HttpResponse.json(detail())))
    const { router } = renderRoutes('/products/5', owner)
    const nameEn = await screen.findByLabelText('English name')
    await userEvent.type(nameEn, 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Back to list' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Unsaved changes')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Stay' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(router.state.location.pathname).toBe('/products/5')
    await userEvent.click(screen.getByRole('button', { name: 'Back to list' }))
    server.use(http.get('/api/admin/products', () => HttpResponse.json({ items: [], page: 0, size: 20, total: 0 })))
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Leave' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/products'))
  })

  it('does not prompt when nothing changed', async () => {
    server.use(
      http.get('/api/admin/products/5', () => HttpResponse.json(detail({ descriptionFa: '<p>سلام <strong>دنیا</strong></p>' }))),
      http.get('/api/admin/products', () => HttpResponse.json({ items: [], page: 0, size: 20, total: 0 })),
    )
    const { router } = renderRoutes('/products/5', owner)
    await screen.findByLabelText('English name')
    await userEvent.click(screen.getByRole('button', { name: 'Back to list' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/products'))
  })
})
