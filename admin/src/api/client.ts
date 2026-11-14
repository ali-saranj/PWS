import type { FieldError, ProblemDetail, StaffMe } from './types'

export class ApiError extends Error {
  status: number
  code: string
  messages: { fa: string; en: string }
  fieldErrors: FieldError[]
  requestId?: string

  constructor(
    status: number,
    code: string,
    messages: { fa: string; en: string },
    fieldErrors: FieldError[] = [],
    requestId?: string,
  ) {
    super(messages.en)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.messages = messages
    this.fieldErrors = fieldErrors
    this.requestId = requestId
  }
}

const AUTH_PREFIX = '/api/admin/auth/'
const REFRESH_PATH = '/api/admin/auth/refresh'
const CSRF_PATH = '/api/admin/auth/csrf'

let sessionExpiredHandler: () => void = () => {}
let refreshInFlight: Promise<RefreshResult> | null = null
let csrfInFlight: Promise<void> | null = null

export function setSessionExpiredHandler(fn: () => void): void {
  sessionExpiredHandler = fn
}

function readCookie(name: string): string | null {
  for (const part of document.cookie.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

async function ensureCsrfToken(): Promise<void> {
  if (readCookie('XSRF-TOKEN')) return
  csrfInFlight ??= (async () => {
    try {
      await send(CSRF_PATH, { method: 'GET' })
    } catch {
      // Ignore: if backend is unreachable or doesn't support /csrf, send() will attempt anyway
    }
  })().finally(() => {
    csrfInFlight = null
  })
  return csrfInFlight
}

interface FetchOptions {
  method?: string
  json?: unknown
  formData?: FormData
  csrfRetried?: boolean
}

function networkError(): ApiError {
  return new ApiError(0, 'NETWORK_ERROR', {
    fa: 'ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.',
    en: 'Could not reach the server. Check your connection.',
  })
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: Partial<ProblemDetail> | null = null
  try {
    body = (await res.json()) as Partial<ProblemDetail>
  } catch {
    body = null
  }
  const fallback = {
    fa: 'خطای غیرمنتظره‌ای رخ داد.',
    en: 'An unexpected error occurred.',
  }
  return new ApiError(
    res.status,
    body?.code ?? 'UNKNOWN_ERROR',
    body?.messages ?? fallback,
    body?.errors ?? [],
    body?.requestId,
  )
}

async function send(path: string, opts: FetchOptions): Promise<Response> {
  const method = (opts.method ?? 'GET').toUpperCase()
  const headers: Record<string, string> = { Accept: 'application/json' }
  let body: BodyInit | undefined
  if (opts.formData) {
    body = opts.formData
  } else if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.json)
  }
  if (method !== 'GET') {
    const token = readCookie('XSRF-TOKEN')
    if (token) headers['X-XSRF-TOKEN'] = token
  }
  try {
    return await fetch(path, { method, headers, body, credentials: 'include' })
  } catch {
    throw networkError()
  }
}

type RefreshResult = { ok: true; staff: StaffMe | null } | { ok: false; error: ApiError; expired: boolean }

/** One shared refresh for all concurrent callers: the API revokes every session on refresh-token reuse. */
function refreshSession(): Promise<RefreshResult> {
  refreshInFlight ??= (async (): Promise<RefreshResult> => {
    try {
      const res = await send(REFRESH_PATH, { method: 'POST' })
      if (res.ok) return { ok: true, staff: await res.json().catch(() => null) }
      return { ok: false, error: await toApiError(res), expired: res.status === 401 || res.status === 403 }
    } catch (e) {
      return { ok: false, error: e instanceof ApiError ? e : networkError(), expired: false }
    }
  })().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const method = (opts.method ?? 'GET').toUpperCase()
  if (method !== 'GET' && path !== CSRF_PATH) {
    await ensureCsrfToken()
  }

  let res = await send(path, opts)

  if (res.status === 401 && !path.startsWith(AUTH_PREFIX)) {
    const original = await toApiError(res)
    const refreshed = await refreshSession()
    if (!refreshed.ok) {
      if (refreshed.expired) {
        sessionExpiredHandler()
        throw original
      }
      throw refreshed.error
    }
    res = await send(path, opts)
  }

  if (res.status === 403 && method !== 'GET' && !opts.csrfRetried) {
    if (!readCookie('XSRF-TOKEN')) {
      await send(CSRF_PATH, { method: 'GET' }).catch(() => {})
    }
    if (readCookie('XSRF-TOKEN')) {
      res = await send(path, { ...opts, csrfRetried: true })
    }
  }

  if (!res.ok) throw await toApiError(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/** Refreshes the session through the shared in-flight refresh and returns the signed-in staff. Throws ApiError. */
export async function refreshAuth(): Promise<StaffMe> {
  const r = await refreshSession()
  if (!r.ok) throw r.error
  if (!r.staff) throw networkError()
  return r.staff
}
