import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { ImageDto } from './types'

function useInvalidateProduct(productId: number) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['product', productId] })
}

export function useUploadImage(productId: number) {
  const invalidate = useInvalidateProduct(productId)
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return apiFetch<ImageDto>(`/api/admin/products/${productId}/images`, { method: 'POST', formData })
    },
    onSuccess: invalidate,
  })
}

export function useReorderImages(productId: number) {
  const invalidate = useInvalidateProduct(productId)
  return useMutation({
    mutationFn: (imageIds: number[]) =>
      apiFetch<ImageDto[]>(`/api/admin/products/${productId}/images/order`, { method: 'PUT', json: { imageIds } }),
    onSettled: invalidate,
  })
}

export function useUpdateImageAlt(productId: number) {
  const invalidate = useInvalidateProduct(productId)
  return useMutation({
    mutationFn: ({ id, altFa, altEn }: { id: number; altFa: string | null; altEn: string | null }) =>
      apiFetch<ImageDto>(`/api/admin/images/${id}`, { method: 'PUT', json: { altFa, altEn } }),
    onSuccess: invalidate,
  })
}

export function useDeleteImage(productId: number) {
  const invalidate = useInvalidateProduct(productId)
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/images/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}
