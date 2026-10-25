import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '../test/server'
import { apiFetch, ApiError, setSessionExpiredHandler } from './client'

const problem = (status: number, code: string) =>
  HttpResponse.json(
    { code, messages: { fa: 'خطا', en: 'Error' }, requestId: 'r1', errors: [{ field: 'a', code: 'REQUIRED', message: 'm' }] },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )

describe('apiFetch', () => {
  beforeEach(() => {
    document.cookie = 'XSRF-TOKEN=tok123; path=/'
    setSessionExpiredHandler(() => {})
  })

  it('sends XSRF header on POST', async () => {
    let header: string | null = null
    server.use(
      http.post('/api/admin/things', ({ request }) => {
        header = request.headers.get('X-XSRF-TOKEN')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const res = await apiFetch('/api/admin/things', { method: 'POST', json: { a: 1 } })
    expect(header).toBe('tok123')
    expect(res).toBeUndefined()
  })

  it('parses problem+json into ApiError', async () => {
    server.use(http.get('/api/admin/things', () => problem(409, 'CONFLICT')))
    const err = (await apiFetch('/api/admin/things').catch((e) => e)) as ApiError
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(409)
    expect(err.code).toBe('CONFLICT')
    expect(err.messages).toEqual({ fa: 'خطا', en: 'Error' })
    expect(err.fieldErrors).toEqual([{ field: 'a', code: 'REQUIRED', message: 'm' }])
    expect(err.requestId).toBe('r1')
  })

  it('maps network errors to ApiError status 0', async () => {
    server.use(http.get('/api/admin/things', () => HttpResponse.error()))
    const err = (await apiFetch('/api/admin/things').catch((e) => e)) as ApiError
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(0)
    expect(err.code).toBe('NETWORK_ERROR')
  })

  it('on 401 refreshes once then retries', async () => {
    let calls = 0
    let refreshes = 0
    server.use(
      http.get('/api/admin/things', () => (++calls === 1 ? problem(401, 'UNAUTHENTICATED') : HttpResponse.json({ ok: true }))),
      http.post('/api/admin/auth/refresh', () => {
        refreshes++
        return HttpResponse.json({ id: 1 })
      }),
    )
    await expect(apiFetch('/api/admin/things')).resolves.toEqual({ ok: true })
    expect(refreshes).toBe(1)
    expect(calls).toBe(2)
  })

  it('does not retry more than once', async () => {
    let calls = 0
    server.use(
      http.get('/api/admin/things', () => {
        calls++
        return problem(401, 'UNAUTHENTICATED')
      }),
      http.post('/api/admin/auth/refresh', () => HttpResponse.json({ id: 1 })),
    )
    await expect(apiFetch('/api/admin/things')).rejects.toMatchObject({ status: 401 })
    expect(calls).toBe(2)
  })

  it('two concurrent 401s trigger a single refresh', async () => {
    const seen = new Set<string>()
    let refreshes = 0
    server.use(
      http.get('/api/admin/:name', ({ params }) => {
        const n = params.name as string
        if (!seen.has(n)) {
          seen.add(n)
          return problem(401, 'UNAUTHENTICATED')
        }
        return HttpResponse.json({ n })
      }),
      http.post('/api/admin/auth/refresh', async () => {
        refreshes++
        await new Promise((r) => setTimeout(r, 30))
        return HttpResponse.json({ id: 1 })
      }),
    )
    const [a, b] = await Promise.all([apiFetch('/api/admin/a'), apiFetch('/api/admin/b')])
    expect(a).toEqual({ n: 'a' })
    expect(b).toEqual({ n: 'b' })
    expect(refreshes).toBe(1)
  })

  it('refresh failure calls session-expired handler and throws', async () => {
    const handler = vi.fn()
    setSessionExpiredHandler(handler)
    server.use(
      http.get('/api/admin/things', () => problem(401, 'UNAUTHENTICATED')),
      http.post('/api/admin/auth/refresh', () => problem(401, 'UNAUTHENTICATED')),
    )
    const err = (await apiFetch('/api/admin/things').catch((e) => e)) as ApiError
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(401)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('refresh network error does not call the handler and throws NETWORK_ERROR', async () => {
    const handler = vi.fn()
    setSessionExpiredHandler(handler)
    server.use(
      http.get('/api/admin/things', () => problem(401, 'UNAUTHENTICATED')),
      http.post('/api/admin/auth/refresh', () => HttpResponse.error()),
    )
    const err = (await apiFetch('/api/admin/things').catch((e) => e)) as ApiError
    expect(err).toBeInstanceOf(ApiError)
    expect(err.code).toBe('NETWORK_ERROR')
    expect(handler).not.toHaveBeenCalled()
  })

  it('refresh 5xx does not call the handler and throws the refresh problem', async () => {
    const handler = vi.fn()
    setSessionExpiredHandler(handler)
    server.use(
      http.get('/api/admin/things', () => problem(401, 'UNAUTHENTICATED')),
      http.post('/api/admin/auth/refresh', () => problem(503, 'SMS_UNAVAILABLE')),
    )
    const err = (await apiFetch('/api/admin/things').catch((e) => e)) as ApiError
    expect(err.status).toBe(503)
    expect(handler).not.toHaveBeenCalled()
  })

  it('does not try to refresh for /api/admin/auth/* calls', async () => {
    let refreshes = 0
    server.use(
      http.post('/api/admin/auth/login', () => problem(401, 'UNAUTHENTICATED')),
      http.post('/api/admin/auth/refresh', () => {
        refreshes++
        return HttpResponse.json({})
      }),
    )
    await expect(apiFetch('/api/admin/auth/login', { method: 'POST', json: {} })).rejects.toMatchObject({ status: 401 })
    expect(refreshes).toBe(0)
  })
})
