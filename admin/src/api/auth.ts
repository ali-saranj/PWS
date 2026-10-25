import type { LoginChallenge, StaffMe } from './types'
import { apiFetch } from './client'

export function csrf(): Promise<void> {
  return apiFetch<void>('/api/admin/auth/csrf')
}

export function login(username: string, password: string): Promise<LoginChallenge> {
  return apiFetch<LoginChallenge>('/api/admin/auth/login', { method: 'POST', json: { username, password } })
}

export function verify(challenge: string, code: string): Promise<StaffMe> {
  return apiFetch<StaffMe>('/api/admin/auth/verify', { method: 'POST', json: { challenge, code } })
}

export function me(): Promise<StaffMe> {
  return apiFetch<StaffMe>('/api/admin/auth/me')
}

export function logout(): Promise<void> {
  return apiFetch<void>('/api/admin/auth/logout', { method: 'POST' })
}
