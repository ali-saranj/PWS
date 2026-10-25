export const PASSWORD_MIN = 10
export const PASSWORD_MAX_BYTES = 72

export function passwordBytes(s: string): number {
  return new TextEncoder().encode(s).length
}
