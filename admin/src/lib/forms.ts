import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'
import type { ApiError } from '../api/client'

/**
 * Puts server field errors on their form fields (when the field is in `knownFields`).
 * Returns the error to show in an ErrorAlert, or null when every field error found a field.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>,
  knownFields: readonly string[],
): ApiError | null {
  let handled = 0
  for (const fe of error.fieldErrors) {
    if (knownFields.includes(fe.field)) {
      setError(fe.field as FieldPath<T>, { type: 'server', message: fe.message })
      handled++
    }
  }
  return handled > 0 && handled === error.fieldErrors.length ? null : error
}
