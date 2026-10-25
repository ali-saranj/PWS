import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '../../i18n'
import type { ImageDto, ProductDetailDto } from '../../api/types'
import { server } from '../../test/server'
import { ImagesTab } from './ImagesTab'

const img = (id: number, sortOrder: number): ImageDto => ({
  id, url: `/media/${id}.webp`, thumbUrl: `/media/${id}-t.webp`, sortOrder, altFa: null, altEn: null,
})

function product(images: ImageDto[]): ProductDetailDto {
  return {
    id: 5, version: 1, brandId: 1, categoryId: 1, slug: 'p', nameFa: 'پ', nameEn: 'P', descriptionFa: null, descriptionEn: null,
    status: 'DRAFT', featured: false, seoTitleFa: null, seoTitleEn: null, seoDescriptionFa: null, seoDescriptionEn: null,
    images, variants: [],
  }
}

function setup(images: ImageDto[]) {
  server.use(http.get('/api/admin/products/5', () => HttpResponse.json(product(images))))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <ImagesTab productId={5} />
    </QueryClientProvider>,
  )
}

beforeEach(() => void i18n.changeLanguage('en'))

describe('ImagesTab', () => {
  it('shows IMAGE_INVALID for a rejected file and keeps uploading the others', async () => {
    const uploaded: string[] = []
    server.use(
      // The multipart body can't be read under jsdom, so files are told apart by (sequential) call order.
      http.post('/api/admin/products/5/images', () => {
        uploaded.push(`call-${uploaded.length + 1}`)
        if (uploaded.length === 2)
          return HttpResponse.json(
            {
              code: 'VALIDATION_FAILED',
              messages: { fa: 'خطا', en: 'Validation failed' },
              errors: [{ field: 'file', code: 'IMAGE_INVALID', message: 'Not a valid image' }],
            },
            { status: 400 },
          )
        return HttpResponse.json(img(1, 0), { status: 201 })
      }),
    )
    setup([])
    const files = [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'bad.png', { type: 'image/png' }),
      new File(['c'], 'c.webp', { type: 'image/webp' }),
      new File(['d'], 'doc.pdf', { type: 'application/pdf' }),
    ]
    await userEvent.upload(screen.getByTestId('image-input'), files, { applyAccept: false })
    expect(await screen.findByText('Not a valid image')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText('Uploaded')).toHaveLength(2))
    expect(uploaded).toEqual(['call-1', 'call-2', 'call-3'])
    expect(screen.getByText(/Only JPEG, PNG and WebP/)).toBeInTheDocument()
  })

  it('rejects files over 5 MB without sending them', async () => {
    let posts = 0
    server.use(http.post('/api/admin/products/5/images', () => { posts++; return HttpResponse.json(img(1, 0), { status: 201 }) }))
    setup([])
    const big = new File(['x'], 'big.png', { type: 'image/png' })
    Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 + 1 })
    await userEvent.upload(screen.getByTestId('image-input'), big)
    expect(await screen.findByText(/must not exceed 5 MB/)).toBeInTheDocument()
    expect(posts).toBe(0)
  })

  it('reorder sends the new id order (button and drag)', async () => {
    const orders: number[][] = []
    server.use(
      http.put('/api/admin/products/5/images/order', async ({ request }) => {
        orders.push(((await request.json()) as { imageIds: number[] }).imageIds)
        return HttpResponse.json([])
      }),
    )
    setup([img(1, 0), img(2, 1), img(3, 2)])
    await userEvent.click(await screen.findByRole('button', { name: 'Move earlier 2' }))
    await waitFor(() => expect(orders).toEqual([[2, 1, 3]]))

    fireEvent.dragStart(screen.getByTestId('image-3'))
    fireEvent.drop(screen.getByTestId('image-1'))
    await waitFor(() => expect(orders[1]).toEqual([3, 1, 2]))
  })

  it('rolls back the order when saving fails', async () => {
    server.use(
      http.put('/api/admin/products/5/images/order', () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR', messages: { fa: 'خطا', en: 'Boom' } }, { status: 500 }),
      ),
    )
    setup([img(1, 0), img(2, 1)])
    await userEvent.click(await screen.findByRole('button', { name: 'Move later 1' }))
    expect(await screen.findByText('Boom')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Move earlier 1' })).toBeDisabled())
  })

  it('deletes an image after confirmation', async () => {
    let deleted = false
    server.use(http.delete('/api/admin/images/1', () => { deleted = true; return new HttpResponse(null, { status: 204 }) }))
    setup([img(1, 0)])
    await userEvent.click(await screen.findByRole('button', { name: 'Delete 1' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Delete', hidden: false }))
    await waitFor(() => expect(deleted).toBe(true))
  })
})
