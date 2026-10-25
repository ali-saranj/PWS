import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { AdjustmentRequest, InventoryRowDto, Page, StockMovementDto } from './types'

export interface InventoryFilters {
  q?: string
  lowStock?: boolean
  page: number
  size: number
}

export function useInventory(f: InventoryFilters) {
  return useQuery({
    queryKey: ['inventory', f],
    queryFn: () => {
      const p = new URLSearchParams()
      if (f.q) p.set('q', f.q)
      if (f.lowStock) p.set('lowStock', 'true')
      p.set('page', String(f.page))
      p.set('size', String(f.size))
      return apiFetch<Page<InventoryRowDto>>(`/api/admin/inventory?${p}`)
    },
    placeholderData: keepPreviousData,
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AdjustmentRequest) =>
      apiFetch<InventoryRowDto[]>('/api/admin/inventory/adjustments', { method: 'POST', json: body }),
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['inventory'] }), qc.invalidateQueries({ queryKey: ['movements'] })]),
  })
}

export function useMovements(variantId: number | null, page: number, size: number) {
  return useQuery({
    queryKey: ['movements', variantId, page, size],
    enabled: variantId != null,
    queryFn: () => apiFetch<Page<StockMovementDto>>(`/api/admin/variants/${variantId}/movements?page=${page}&size=${size}`),
    placeholderData: keepPreviousData,
  })
}
