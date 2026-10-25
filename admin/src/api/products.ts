import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { Page, ProductDetailDto, ProductStatus, ProductSummaryDto, ProductUpsertRequest } from './types'

export interface ProductFilters {
  q?: string
  status?: ProductStatus
  categoryId?: number
  brandId?: number
  page?: number
  size?: number
}

function toQuery(filters: ProductFilters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => apiFetch<Page<ProductSummaryDto>>(`/api/admin/products${toQuery(filters)}`),
  })
}

export function useProduct(id: number | undefined) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => apiFetch<ProductDetailDto>(`/api/admin/products/${id}`),
    enabled: id != null,
  })
}

function useStoreDetail() {
  const qc = useQueryClient()
  return (detail: ProductDetailDto) => {
    qc.setQueryData(['product', detail.id], detail)
    return qc.invalidateQueries({ queryKey: ['products'] })
  }
}

export function useCreateProduct() {
  const store = useStoreDetail()
  return useMutation({
    mutationFn: (body: ProductUpsertRequest) =>
      apiFetch<ProductDetailDto>('/api/admin/products', { method: 'POST', json: body }),
    onSuccess: store,
  })
}

export function useUpdateProduct() {
  const store = useStoreDetail()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ProductUpsertRequest }) =>
      apiFetch<ProductDetailDto>(`/api/admin/products/${id}`, { method: 'PUT', json: body }),
    onSuccess: store,
  })
}

export function useSetProductStatus() {
  const store = useStoreDetail()
  return useMutation({
    mutationFn: ({ id, status, version }: { id: number; status: ProductStatus; version: number }) =>
      apiFetch<ProductDetailDto>(`/api/admin/products/${id}/status`, { method: 'POST', json: { status, version } }),
    onSuccess: store,
  })
}
