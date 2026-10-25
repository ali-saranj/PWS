import { Box, Button, CircularProgress, Stack } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { flushSync } from 'react-dom'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { csrf, logout, me } from '../api/auth'
import { ApiError, refreshAuth, setSessionExpiredHandler } from '../api/client'
import type { StaffMe } from '../api/types'
import { ErrorAlert } from '../components/ErrorAlert'

export interface AuthState {
  staff: StaffMe | null
  loading: boolean
  signIn(me: StaffMe): void
  signOut(): Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

/** Boots the session (csrf, then me) and exposes it. Must render inside the data router. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [staff, setStaff] = useState<StaffMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [bootError, setBootError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(0)

  const locationRef = useRef(location)
  useEffect(() => {
    locationRef.current = location
  }, [location])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setBootError(null)
    csrf()
      .then(() =>
        me().catch((e: unknown) => {
          // Access token expired but the refresh cookie may still be valid.
          if (e instanceof ApiError && e.status === 401) return refreshAuth()
          throw e
        }),
      )
      .then((s) => {
        if (!cancelled) setStaff(s)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        if (!(e instanceof ApiError && (e.status === 401 || e.status === 403))) setBootError(e)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  // May fire once per concurrent request, so it must be idempotent.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      queryClient.clear()
      setStaff(null)
      const current = locationRef.current
      if (current.pathname !== '/login') {
        void navigate('/login', { replace: true, state: { from: current } })
      }
    })
    return () => setSessionExpiredHandler(() => {})
  }, [queryClient, navigate])

  const signIn = useCallback((s: StaffMe) => setStaff(s), [])

  const signOut = useCallback(async () => {
    try {
      await logout()
    } catch {
      // leave anyway: the server session expires on its own
    }
    queryClient.clear()
    // Commit the signed-out state first (RequireRole may redirect with a `from`), then navigate
    // explicitly with empty state so no previous page survives the logout.
    flushSync(() => setStaff(null))
    await navigate('/login', { replace: true, state: null })
  }, [queryClient, navigate])

  const value = useMemo(() => ({ staff, loading, signIn, signOut }), [staff, loading, signIn, signOut])

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress aria-label={t('common.loading')} />
      </Box>
    )
  }
  if (bootError) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 480, mx: 'auto', mt: 8, px: 2 }}>
        <ErrorAlert error={bootError} />
        <Button variant="contained" onClick={() => setAttempt((n) => n + 1)}>
          {t('common.retry')}
        </Button>
      </Stack>
    )
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Root route element: auth boot around every page. */
export function AuthRoot() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
