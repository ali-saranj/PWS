import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { applyFieldErrors } from './forms'

const msgs = { fa: 'خطا', en: 'Error' }

describe('applyFieldErrors', () => {
  it('sets known fields and returns null when all were handled', () => {
    const setError = vi.fn()
    const err = new ApiError(400, 'VALIDATION_FAILED', msgs, [{ field: 'slug', code: 'DUPLICATE', message: 'Taken' }])
    expect(applyFieldErrors(err, setError, ['slug', 'nameFa'])).toBeNull()
    expect(setError).toHaveBeenCalledWith('slug', { type: 'server', message: 'Taken' })
  })

  it('returns the error when some field is unknown', () => {
    const setError = vi.fn()
    const err = new ApiError(400, 'VALIDATION_FAILED', msgs, [
      { field: 'slug', code: 'DUPLICATE', message: 'Taken' },
      { field: 'other', code: 'INVALID', message: 'Bad' },
    ])
    expect(applyFieldErrors(err, setError, ['slug'])).toBe(err)
    expect(setError).toHaveBeenCalledTimes(1)
  })

  it('returns the error when there are no field errors', () => {
    const setError = vi.fn()
    const err = new ApiError(409, 'RESOURCE_IN_USE', msgs)
    expect(applyFieldErrors(err, setError, ['slug'])).toBe(err)
    expect(setError).not.toHaveBeenCalled()
  })
})
