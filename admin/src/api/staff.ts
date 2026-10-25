import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { CreateStaffRequest, PasswordRequest, StaffDto, UpdateStaffRequest } from './types'

const KEY = ['staff']

export function useStaffList() {
  return useQuery({ queryKey: KEY, queryFn: () => apiFetch<StaffDto[]>('/api/admin/staff') })
}

export function useSaveStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: CreateStaffRequest | UpdateStaffRequest }) =>
      id == null
        ? apiFetch<StaffDto>('/api/admin/staff', { method: 'POST', json: body })
        : apiFetch<StaffDto>(`/api/admin/staff/${id}`, { method: 'PUT', json: body }),
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: KEY }), qc.invalidateQueries({ queryKey: ['audit'] })]),
  })
}

export function useResetPassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: PasswordRequest }) =>
      apiFetch<void>(`/api/admin/staff/${id}/password`, { method: 'POST', json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit'] }),
  })
}
