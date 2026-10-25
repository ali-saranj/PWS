/**
 * Normalises a link typed into the editor so the server's sanitiser keeps it.
 * Returns '' for empty input (remove link), null for unsafe schemes (ignore input),
 * otherwise an http(s)/mailto URL; scheme-less input gets https://.
 */
export function normalizeLinkUrl(input: string): string | null {
  const s = input.trim()
  if (s === '') return ''
  if (/^(https?:\/\/|mailto:)/i.test(s)) return s
  if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(s)) return null
  return `https://${s.replace(/^\/+/, '')}`
}
