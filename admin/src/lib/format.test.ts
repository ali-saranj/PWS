import { describe, expect, it } from 'vitest'
import { formatDate, formatToman, parseLocalizedInt, parseLocalizedSignedInt, rialsToToman, tomanToRials } from './format'

describe('format', () => {
  it('parses localized integers', () => {
    expect(parseLocalizedInt('۱٬۲۰۰٬۰۰۰')).toBe(1200000)
    expect(parseLocalizedInt('1,200,000')).toBe(1200000)
    expect(parseLocalizedInt('٣٤')).toBe(34)
    expect(parseLocalizedInt('')).toBeNull()
    expect(parseLocalizedInt('12a')).toBeNull()
    expect(parseLocalizedInt('1.5')).toBeNull()
  })

  it('parses signed localized integers', () => {
    expect(parseLocalizedSignedInt('-۵')).toBe(-5)
    expect(parseLocalizedSignedInt('+٣')).toBe(3)
    expect(parseLocalizedSignedInt('−12')).toBe(-12)
    expect(parseLocalizedSignedInt('7')).toBe(7)
    expect(parseLocalizedSignedInt('-0')).toBe(0)
    expect(parseLocalizedSignedInt('-')).toBeNull()
    expect(parseLocalizedSignedInt('')).toBeNull()
    expect(parseLocalizedSignedInt('1-2')).toBeNull()
    expect(parseLocalizedSignedInt('1.5')).toBeNull()
  })

  it('formats toman', () => {
    expect(formatToman(12_000_000, 'fa')).toBe('۱٬۲۰۰٬۰۰۰ تومان')
    expect(formatToman(12_000_000, 'en')).toBe('1,200,000 Toman')
  })

  it('converts between rials and toman', () => {
    expect(tomanToRials(1_200_000)).toBe(12_000_000)
    expect(rialsToToman(12_000_000)).toBe(1_200_000)
  })

  it('formats dates in Tehran time', () => {
    expect(formatDate('2026-10-25T10:00:00Z', 'fa')).toBe('۱۴۰۵/۰۸/۰۳')
    expect(formatDate('2026-10-25T10:00:00Z', 'en')).toBe('Oct 25, 2026')
  })
})
