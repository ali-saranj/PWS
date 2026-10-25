import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { TierDto, VariantDto, VariantUpsertRequest } from './types'

function useInvalidateProduct(productId: number) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['product', productId] })
}

export function useCreateVariant(productId: number) {
  const invalidate = useInvalidateProduct(productId)
  return useMutation({
    mutationFn: (body: VariantUpsertRequest) =>
      apiFetch<VariantDto>(`/api/admin/products/${productId}/variants`, { method: 'POST', json: body }),
    onSuccess: invalidate,
  })
}

export function useUpdateVariant(productId: number) {
  const invalidate = useInvalidateProduct(productId)
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: VariantUpsertRequest }) =>
      apiFetch<VariantDto>(`/api/admin/variants/${id}`, { method: 'PUT', json: body }),
    onSuccess: invalidate,
  })
}

export function useSaveTiers(productId: number) {
  const invalidate = useInvalidateProduct(productId)
  return useMutation({
    mutationFn: ({ id, tiers }: { id: number; tiers: TierDto[] }) =>
      apiFetch<VariantDto>(`/api/admin/variants/${id}/tiers`, { method: 'PUT', json: { tiers } }),
    onSuccess: invalidate,
  })
}
