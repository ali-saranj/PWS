import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { RouterProvider, createMemoryRouter } from 'react-router'
import '../i18n'
import i18n from '../i18n'
import type { StaffMe } from '../api/types'
import { routes } from '../routes'
import { server } from './server'

/** Renders the real route tree at `path`; /csrf succeeds and /me returns `staff` (or 401 when null). */
export function renderRoutes(path: string, staff: StaffMe | null) {
  void i18n.changeLanguage('en')
  server.use(
    http.get('/api/admin/auth/csrf', () => new HttpResponse(null, { status: 204 })),
    http.get('/api/admin/auth/me', () =>
      staff
        ? HttpResponse.json(staff)
        : HttpResponse.json(
            { code: 'UNAUTHENTICATED', messages: { fa: 'ورود لازم است', en: 'Sign in required' } },
            { status: 401 },
          ),
    ),
  )
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}
