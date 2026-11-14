import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

export const defaultCsrfHandler = http.get('/api/admin/auth/csrf', () => {
  document.cookie = 'XSRF-TOKEN=test-csrf; path=/'
  return new HttpResponse(null, { status: 204 })
})

export const server = setupServer(defaultCsrfHandler)
