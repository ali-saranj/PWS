import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { AuditEntryDto, Page } from './types'

export interface AuditFilters {
  entityType?: string
  staffUserId?: number
  page: number
  size: number
}

export function useAudit(f: AuditFilters) {
  return useQuery({
    queryKey: ['audit', f],
    queryFn: () => {
      const p = new URLSearchParams()
      if (f.entityType) p.set('entityType', f.entityType)
      if (f.staffUserId != null) p.set('staffUserId', String(f.staffUserId))
      p.set('page', String(f.page))
      p.set('size', String(f.size))
      return apiFetch<Page<AuditEntryDto>>(`/api/admin/audit?${p}`)
    },
    placeholderData: keepPreviousData,
  })
}
