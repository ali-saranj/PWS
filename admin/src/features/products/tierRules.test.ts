import { describe, expect, it } from 'vitest'
import { validateTiers } from './tierRules'

describe('tierRules', () => {
  it('accepts a valid ladder', () => {
    expect(validateTiers(1000, [{ minQty: 2, unitToman: 900 }, { minQty: 5, unitToman: 800 }])).toEqual([])
  })

  it('rejects minQty < 2', () => {
    expect(validateTiers(1000, [{ minQty: 1, unitToman: 900 }])).toEqual([
      { index: 0, field: 'minQty', messageKey: 'products.tiers.errors.minQty' },
    ])
  })

  it('rejects price >= base and non-positive price', () => {
    const r = validateTiers(1000, [{ minQty: 2, unitToman: 1000 }, { minQty: 3, unitToman: 0 }])
    expect(r.map((e) => [e.index, e.field])).toEqual([[0, 'unitPrice'], [1, 'unitPrice']])
  })

  it('rejects non-decreasing price', () => {
    const r = validateTiers(1000, [{ minQty: 2, unitToman: 800 }, { minQty: 5, unitToman: 800 }])
    expect(r).toEqual([{ index: 1, field: 'unitPrice', messageKey: 'products.tiers.errors.unitPrice' }])
  })

  it('rejects duplicate minQty (second occurrence)', () => {
    const r = validateTiers(1000, [{ minQty: 3, unitToman: 900 }, { minQty: 3, unitToman: 800 }])
    expect(r.filter((e) => e.field === 'minQty')).toEqual([
      { index: 1, field: 'minQty', messageKey: 'products.tiers.errors.minQty' },
    ])
  })
})
