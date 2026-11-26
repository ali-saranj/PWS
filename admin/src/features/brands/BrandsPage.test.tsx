import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import type { BrandDto } from '../../api/types'
import { renderRoutes } from '../../test/renderRoutes'
import { server } from '../../test/server'

const owner = { id: 1, username: 'owner', fullName: 'Main Owner', role: 'OWNER' as const }
const brand: BrandDto = { id: 7, nameFa: 'اپتیموم', nameEn: 'Optimum', slug: 'optimum', logoUrl: null, active: true }

describe('BrandsPage', () => {
  it('rejects logos over 5 MB client-side', async () => {
    let called = false
    server.use(
      http.get('/api/admin/brands', () => HttpResponse.json([brand])),
      http.post('/api/admin/brands/7/logo', () => {
        called = true
        return HttpResponse.json(brand)
      }),
    )
    renderRoutes('/brands', owner)
    const input = await screen.findByTestId('logo-input-7')
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [big] } })
    expect(await screen.findByText('The file must not exceed 5 MB.')).toBeInTheDocument()
    expect(called).toBe(false)
  })

  it('uploads a logo, refreshes the list, and shows IMAGE_INVALID from the server', async () => {
    let lists = 0
    let fail = false
    server.use(
      http.get('/api/admin/brands', () => {
        lists++
        return HttpResponse.json([brand])
      }),
      http.post('/api/admin/brands/7/logo', () =>
        fail
          ? HttpResponse.json(
              { code: 'IMAGE_INVALID', messages: { fa: 'تصویر نامعتبر', en: 'Not a valid image' } },
              { status: 400 },
            )
          : HttpResponse.json(brand),
      ),
    )
    renderRoutes('/brands', owner)
    const input = await screen.findByTestId('logo-input-7')
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    await userEvent.upload(input, file)
    await vi_waitFor(() => lists === 2)
    fail = true
    await userEvent.upload(input, file)
    expect(await screen.findByText('Not a valid image')).toBeInTheDocument()
  })

  it('shows RESOURCE_IN_USE when deleting a used brand', async () => {
    server.use(
      http.get('/api/admin/brands', () => HttpResponse.json([brand])),
      http.delete('/api/admin/brands/7', () =>
        HttpResponse.json(
          { code: 'RESOURCE_IN_USE', messages: { fa: 'در حال استفاده', en: 'Brand is in use' } },
          { status: 409 },
        ),
      ),
    )
    renderRoutes('/brands', owner)
    await userEvent.click(await screen.findByRole('button', { name: /Delete: اپتیموم/ }))
    const confirm = (await screen.findAllByRole('button', { name: 'Delete' })).at(-1)!
    await userEvent.click(confirm)
    expect(await screen.findByText('Brand is in use')).toBeInTheDocument()
  })

  it('clears a stale delete error when a later logo upload is rejected', async () => {
    server.use(
      http.get('/api/admin/brands', () => HttpResponse.json([brand])),
      http.delete('/api/admin/brands/7', () =>
        HttpResponse.json(
          { code: 'RESOURCE_IN_USE', messages: { fa: 'در حال استفاده', en: 'Brand is in use' } },
          { status: 409 },
        ),
      ),
    )
    renderRoutes('/brands', owner)
    await userEvent.click(await screen.findByRole('button', { name: /Delete: اپتیموم/ }))
    await userEvent.click((await screen.findAllByRole('button', { name: 'Delete' })).at(-1)!)
    expect(await screen.findByText('Brand is in use')).toBeInTheDocument()
    const big = new File([new Uint8Array(6 * 1024 * 1024)], 'big.png', { type: 'image/png' })
    fireEvent.change(screen.getByTestId('logo-input-7'), { target: { files: [big] } })
    expect(await screen.findByText('The file must not exceed 5 MB.')).toBeInTheDocument()
    expect(screen.queryByText('Brand is in use')).not.toBeInTheDocument()
  })

  it('submits optional SEO fields when expanded in BrandDialog', async () => {
    let submitted: unknown
    server.use(
      http.get('/api/admin/brands', () => HttpResponse.json([brand])),
      http.post('/api/admin/brands', async ({ request }) => {
        submitted = await request.json()
        return HttpResponse.json({ ...brand, id: 8, ...(submitted as object) }, { status: 201 })
      }),
    )
    renderRoutes('/brands', owner)
    await userEvent.click(await screen.findByRole('button', { name: 'Add brand' }))
    const { within } = await import('@testing-library/react')
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Persian name'), 'آندره')
    await userEvent.type(within(dialog).getByLabelText('Slug'), 'andre')
    await userEvent.click(within(dialog).getByRole('button', { name: 'SEO settings (optional)' }))
    await userEvent.type(within(dialog).getByLabelText('SEO title'), 'خرید محصولات آندره')
    await userEvent.type(within(dialog).getByLabelText('SEO meta description'), 'توضیحات برند')
    await userEvent.type(within(dialog).getByLabelText('SEO H1 heading'), 'برند آندره')
    await userEvent.type(within(dialog).getByLabelText('SEO intro copy (Persian)'), 'متن برند')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(submitted).toMatchObject({
      nameFa: 'آندره',
      slug: 'andre',
      seoTitle: 'خرید محصولات آندره',
      seoDescription: 'توضیحات برند',
      seoH1: 'برند آندره',
      seoContentFa: 'متن برند',
    })
  })
})

async function vi_waitFor(cond: () => boolean) {
  const { waitFor } = await import('@testing-library/react')
  await waitFor(() => expect(cond()).toBe(true))
}
