import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { BrandDto, BrandRequest } from './types'

const KEY = ['brands']

export function useBrands() {
  return useQuery({ queryKey: KEY, queryFn: () => apiFetch<BrandDto[]>('/api/admin/brands') })
}

export function useSaveBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: BrandRequest }) =>
      id == null
        ? apiFetch<BrandDto>('/api/admin/brands', { method: 'POST', json: body })
        : apiFetch<BrandDto>(`/api/admin/brands/${id}`, { method: 'PUT', json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/brands/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUploadBrandLogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      return apiFetch<BrandDto>(`/api/admin/brands/${id}/logo`, { method: 'POST', formData })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
