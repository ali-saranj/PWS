import { describe, expect, it } from 'vitest'
import { slugify } from './slug'

describe('slugify', () => {
  it('lower-cases and replaces non-alphanumerics with dashes', () => {
    expect(slugify('Whey Protein_100%')).toBe('whey-protein-100')
  })
  it('collapses repeats and trims dashes', () => {
    expect(slugify('  --A   &&  B--  ')).toBe('a-b')
  })
  it('returns empty for non-latin input', () => {
    expect(slugify('پروتئین')).toBe('')
  })
  it('caps at 120 characters without a trailing dash', () => {
    const out = slugify(`${'a'.repeat(119)} b`)
    expect(out.length).toBeLessThanOrEqual(120)
    expect(out.endsWith('-')).toBe(false)
  })
})
