import { describe, expect, it } from 'vitest'
import { normalizeLinkUrl } from './linkUrl'

describe('normalizeLinkUrl', () => {
  it('prefixes https:// on scheme-less input', () => {
    expect(normalizeLinkUrl('example.com')).toBe('https://example.com')
    expect(normalizeLinkUrl(' //example.com/a ')).toBe('https://example.com/a')
    expect(normalizeLinkUrl('example.com:8080/x')).toBe('https://example.com:8080/x')
  })
  it('keeps http(s) and mailto as given', () => {
    expect(normalizeLinkUrl('http://a.io')).toBe('http://a.io')
    expect(normalizeLinkUrl('HTTPS://a.io')).toBe('HTTPS://a.io')
    expect(normalizeLinkUrl('mailto:a@b.co')).toBe('mailto:a@b.co')
  })
  it('rejects other schemes and treats empty as remove', () => {
    expect(normalizeLinkUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeLinkUrl('data:text/html,x')).toBeNull()
    expect(normalizeLinkUrl('  ')).toBe('')
  })
})
