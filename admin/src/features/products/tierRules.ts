export interface TierRow {
  minQty: number
  unitToman: number
}

export interface TierRuleError {
  index: number
  field: 'minQty' | 'unitPrice'
  messageKey: string
}

/** Mirrors TierPricing.validate on the API, in Toman. Indexes follow the given row order. */
export function validateTiers(baseToman: number, tiers: TierRow[]): TierRuleError[] {
  const errors: TierRuleError[] = []
  tiers.forEach((t, i) => {
    const qtyBad = t.minQty < 2 || tiers.slice(0, i).some((o) => o.minQty === t.minQty)
    if (qtyBad) errors.push({ index: i, field: 'minQty', messageKey: 'products.tiers.errors.minQty' })
    const priceBad =
      t.unitToman <= 0 ||
      t.unitToman >= baseToman ||
      tiers.some((o) => o.minQty >= 2 && o.minQty < t.minQty && t.unitToman >= o.unitToman)
    if (priceBad) errors.push({ index: i, field: 'unitPrice', messageKey: 'products.tiers.errors.unitPrice' })
  })
  return errors
}

/** Unit price (Toman) for `qty`: the tier with the largest minQty <= qty, else the base price. */
export function unitTomanFor(baseToman: number, tiers: TierRow[], qty: number): number {
  let bestQty = 0
  let price = baseToman
  for (const t of tiers) {
    if (t.minQty <= qty && t.minQty > bestQty) {
      bestQty = t.minQty
      price = t.unitToman
    }
  }
  return price
}
