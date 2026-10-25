import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { CategoryDto, CategoryRequest } from './types'

const KEY = ['categories']

export function useCategories() {
  return useQuery({ queryKey: KEY, queryFn: () => apiFetch<CategoryDto[]>('/api/admin/categories') })
}

export function useSaveCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: CategoryRequest }) =>
      id == null
        ? apiFetch<CategoryDto>('/api/admin/categories', { method: 'POST', json: body })
        : apiFetch<CategoryDto>(`/api/admin/categories/${id}`, { method: 'PUT', json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
