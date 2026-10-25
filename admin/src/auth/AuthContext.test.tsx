import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { apiFetch } from '../api/client'
import { renderRoutes } from '../test/renderRoutes'
import { server } from '../test/server'

const owner = { id: 1, username: 'owner', fullName: 'Main Owner', role: 'OWNER' as const }
const unauth = () =>
  HttpResponse.json({ code: 'UNAUTHENTICATED', messages: { fa: 'ورود لازم است', en: 'Sign in required' } }, { status: 401 })
const csrfOk = http.get('/api/admin/auth/csrf', () => new HttpResponse(null, { status: 204 }))

describe('boot', () => {
  it('me 401 then refresh 200 signs in without the login page', async () => {
    let refreshes = 0
    server.use(
      csrfOk,
      http.get('/api/admin/auth/me', unauth),
      http.post('/api/admin/auth/refresh', () => {
        refreshes++
        return HttpResponse.json(owner)
      }),
    )
    const { router } = renderRoutes('/staff', null, { customBoot: true })
    expect(await screen.findByText('Main Owner')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/staff')
    expect(refreshes).toBe(1)
  })

  it('me 401 then refresh 401 shows the login page', async () => {
    server.use(csrfOk, http.get('/api/admin/auth/me', unauth), http.post('/api/admin/auth/refresh', unauth))
    const { router } = renderRoutes('/staff', null, { customBoot: true })
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('me 401 then refresh network error shows an error with retry, and retry re-runs boot', async () => {
    let fail = true
    server.use(
      csrfOk,
      http.get('/api/admin/auth/me', unauth),
      http.post('/api/admin/auth/refresh', () => (fail ? HttpResponse.error() : HttpResponse.json(owner))),
    )
    renderRoutes('/', null, { customBoot: true })
    expect(await screen.findByText(/Could not reach the server/)).toBeInTheDocument()
    fail = false
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Welcome, Main Owner')).toBeInTheDocument()
  })

  it('me 500 shows an error with retry', async () => {
    server.use(
      csrfOk,
      http.get('/api/admin/auth/me', () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR', messages: { fa: 'خطا', en: 'Server broke' } }, { status: 500 }),
      ),
    )
    renderRoutes('/', null, { customBoot: true })
    expect(await screen.findByText('Server broke')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})

describe('session end', () => {
  it('session-expired handler clears cache, goes to /login with from state, and is safe twice', async () => {
    server.use(
      http.get('/api/admin/thing', unauth),
      http.post('/api/admin/auth/refresh', unauth),
    )
    const { router, client } = renderRoutes('/categories', owner)
    await screen.findByText('Categories', { selector: 'h5' })
    client.setQueryData(['k'], 1)
    await act(async () => {
      await Promise.allSettled([apiFetch('/api/admin/thing'), apiFetch('/api/admin/thing')])
    })
    await screen.findByRole('button', { name: 'Sign in' })
    expect(client.getQueryData(['k'])).toBeUndefined()
    expect(router.state.location.pathname).toBe('/login')
    expect((router.state.location.state as { from: { pathname: string } }).from.pathname).toBe('/categories')
  })

  it('logout lands on /login with no from state even when the request fails', async () => {
    server.use(http.post('/api/admin/auth/logout', () => HttpResponse.error()))
    const { router, client } = renderRoutes('/categories', owner)
    client.setQueryData(['k'], 1)
    await userEvent.click(await screen.findByRole('button', { name: 'Log out' }))
    await screen.findByRole('button', { name: 'Sign in' })
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.state).toBeNull()
    expect(client.getQueryData(['k'])).toBeUndefined()
  })
})
