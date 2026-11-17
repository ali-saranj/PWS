import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server'
import { renderRoutes } from '../test/renderRoutes'

const owner = { id: 1, username: 'owner', fullName: 'Main Owner', role: 'OWNER' as const }

function problem(status: number, code: string, en: string) {
  return HttpResponse.json({ code, messages: { fa: 'خطا', en } }, { status })
}

async function fillStep1() {
  await userEvent.type(await screen.findByLabelText('Username'), 'owner')
  await userEvent.type(screen.getByLabelText('Password'), 'secret-pass')
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('LoginPage', () => {
  it('step 1 shows masked mobile then step 2 verifies and navigates to /', async () => {
    let verifyBody: unknown
    server.use(
      http.post('/api/admin/auth/login', () => HttpResponse.json({ challenge: 'c1', mobileMasked: '0912***4567' })),
      http.post('/api/admin/auth/verify', async ({ request }) => {
        verifyBody = await request.json()
        return HttpResponse.json(owner)
      }),
    )
    const { router } = renderRoutes('/login', null)
    await fillStep1()
    expect(await screen.findByText(/0912\*\*\*4567/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Verification code'), '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Verify and sign in' }))
    expect(await screen.findByText('Welcome, Main Owner')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
    expect(verifyBody).toEqual({ challenge: 'c1', code: '123456' })
  })

  it('wrong password shows server message', async () => {
    server.use(
      http.post('/api/admin/auth/login', () => problem(401, 'UNAUTHENTICATED', 'Invalid username or password')),
    )
    renderRoutes('/login', null)
    await fillStep1()
    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument()
  })

  it('rate limited shows server message', async () => {
    server.use(http.post('/api/admin/auth/login', () => problem(429, 'RATE_LIMITED', 'Too many attempts, try later')))
    renderRoutes('/login', null)
    await fillStep1()
    expect(await screen.findByText('Too many attempts, try later')).toBeInTheDocument()
  })

  it('code field accepts Persian digits', async () => {
    let code: unknown
    server.use(
      http.post('/api/admin/auth/login', () => HttpResponse.json({ challenge: 'c1', mobileMasked: '0912***4567' })),
      http.post('/api/admin/auth/verify', async ({ request }) => {
        code = ((await request.json()) as { code: string }).code
        return HttpResponse.json(owner)
      }),
    )
    renderRoutes('/login', null)
    await fillStep1()
    await userEvent.type(await screen.findByLabelText('Verification code'), '۱۲۳۴۵')
    await userEvent.click(screen.getByRole('button', { name: 'Verify and sign in' }))
    await screen.findByText('Welcome, Main Owner')
    expect(code).toBe('12345')
  })

  it('Back returns to step 1 keeping the username', async () => {
    server.use(
      http.post('/api/admin/auth/login', () => HttpResponse.json({ challenge: 'c1', mobileMasked: '0912***4567' })),
    )
    renderRoutes('/login', null)
    await fillStep1()
    await userEvent.click(await screen.findByRole('button', { name: 'Back' }))
    expect(await screen.findByLabelText('Username')).toHaveValue('owner')
  })

  it('direct login when SMS is unavailable navigates directly to / without step 2', async () => {
    server.use(
      http.post('/api/admin/auth/login', () => HttpResponse.json({ staff: owner })),
    )
    const { router } = renderRoutes('/login', null)
    await fillStep1()
    expect(await screen.findByText('Welcome, Main Owner')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
    expect(screen.queryByLabelText('Verification code')).not.toBeInTheDocument()
  })
})
