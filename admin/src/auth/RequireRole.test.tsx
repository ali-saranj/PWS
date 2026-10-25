import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoutes } from '../test/renderRoutes'

describe('RequireRole', () => {
  it('redirects when signed out', async () => {
    const router = renderRoutes('/staff', null)
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('shows no-access for wrong role', async () => {
    renderRoutes('/staff', { id: 2, username: 'op', fullName: 'Op Erator', role: 'ORDER_OPERATOR' })
    expect(await screen.findByText('No access')).toBeInTheDocument()
  })
})
