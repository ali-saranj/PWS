import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import type { CategoryDto } from '../../api/types'
import { renderRoutes } from '../../test/renderRoutes'
import { server } from '../../test/server'

const owner = { id: 1, username: 'owner', fullName: 'Main Owner', role: 'OWNER' as const }
const cat = (id: number, parentId: number | null, nameFa: string): CategoryDto => ({
  id, parentId, nameFa, nameEn: null, slug: `c${id}`, sortOrder: id, active: true,
})
const list = [cat(1, null, 'مکمل‌ها'), cat(2, 1, 'پروتئین')]

describe('CategoriesPage', () => {
  it('renders the tree with children indented', async () => {
    server.use(http.get('/api/admin/categories', () => HttpResponse.json(list)))
    renderRoutes('/categories', owner)
    const child = await screen.findByTestId('category-row-2')
    expect(screen.getByTestId('category-row-1')).toHaveStyle({ paddingInlineStart: '0px' })
    expect(child).toHaveStyle({ paddingInlineStart: '24px' })
  })

  it('deleting a category in use shows RESOURCE_IN_USE message', async () => {
    server.use(
      http.get('/api/admin/categories', () => HttpResponse.json(list)),
      http.delete('/api/admin/categories/2', () =>
        HttpResponse.json(
          { code: 'RESOURCE_IN_USE', messages: { fa: 'در حال استفاده است', en: 'Category is in use' } },
          { status: 409 },
        ),
      ),
    )
    renderRoutes('/categories', owner)
    await userEvent.click(await screen.findByRole('button', { name: /Delete: پروتئین/ }))
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }))
    expect(await screen.findByText('Category is in use')).toBeInTheDocument()
  })

  it('duplicate slug error is shown under the slug field', async () => {
    let body: unknown
    server.use(
      http.get('/api/admin/categories', () => HttpResponse.json(list)),
      http.post('/api/admin/categories', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(
          {
            code: 'VALIDATION_FAILED',
            messages: { fa: 'نامعتبر', en: 'Invalid' },
            errors: [{ field: 'slug', code: 'DUPLICATE', message: 'Slug already exists' }],
          },
          { status: 400 },
        )
      }),
    )
    renderRoutes('/categories', owner)
    await userEvent.click(await screen.findByRole('button', { name: 'Add category' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Persian name'), 'نو')
    await userEvent.type(within(dialog).getByLabelText('English name'), 'New Cat')
    expect(within(dialog).getByLabelText('Slug')).toHaveValue('new-cat')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(await within(dialog).findByText('Slug already exists')).toBeInTheDocument()
    expect(body).toMatchObject({ nameFa: 'نو', slug: 'new-cat', parentId: null, sortOrder: 0, active: true })
  })

  it('stops auto-filling the slug once edited and excludes self and descendants from the parent select', async () => {
    server.use(http.get('/api/admin/categories', () => HttpResponse.json(list)))
    renderRoutes('/categories', owner)
    await userEvent.click(await screen.findByRole('button', { name: /Edit: مکمل‌ها/ }))
    const dialog = await screen.findByRole('dialog')
    const options = within(dialog).getAllByRole('option').map((o) => o.textContent)
    expect(options).toEqual(['No parent (top level)'])
    await userEvent.type(within(dialog).getByLabelText('English name'), 'x')
    expect(within(dialog).getByLabelText('Slug')).toHaveValue('c1')
  })

  it('shows required and slug-format validation without calling the API', async () => {
    server.use(http.get('/api/admin/categories', () => HttpResponse.json(list)))
    renderRoutes('/categories', owner)
    await userEvent.click(await screen.findByRole('button', { name: 'Add category' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Slug'), 'Bad Slug')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(await within(dialog).findByText('This field is required.')).toBeInTheDocument()
    expect(within(dialog).getByText(/lowercase letters/)).toBeInTheDocument()
  })

  it('submits optional SEO fields when expanded in CategoryDialog', async () => {
    let submitted: unknown
    server.use(
      http.get('/api/admin/categories', () => HttpResponse.json(list)),
      http.post('/api/admin/categories', async ({ request }) => {
        submitted = await request.json()
        return HttpResponse.json({ ...cat(3, null, 'سوسیس'), ...(submitted as object) }, { status: 201 })
      }),
    )
    renderRoutes('/categories', owner)
    await userEvent.click(await screen.findByRole('button', { name: 'Add category' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Persian name'), 'سوسیس')
    await userEvent.type(within(dialog).getByLabelText('Slug'), 'sausage')
    await userEvent.click(within(dialog).getByRole('button', { name: 'SEO settings (optional)' }))
    await userEvent.type(within(dialog).getByLabelText('SEO title'), 'خرید سوسیس')
    await userEvent.type(within(dialog).getByLabelText('SEO meta description'), 'توضیحات سئو')
    await userEvent.type(within(dialog).getByLabelText('SEO H1 heading'), 'سوسیس تازه')
    await userEvent.type(within(dialog).getByLabelText('SEO intro copy (Persian)'), 'متن معرفی')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(submitted).toMatchObject({
      nameFa: 'سوسیس',
      slug: 'sausage',
      seoTitle: 'خرید سوسیس',
      seoDescription: 'توضیحات سئو',
      seoH1: 'سوسیس تازه',
      seoContentFa: 'متن معرفی',
    })
  })
})
