import { describe, expect, it } from 'vitest'
import { visibleNavItems } from './nav'

describe('visibleNavItems', () => {
  it('shows dashboard and orders to order operators', () => {
    expect(visibleNavItems('ORDER_OPERATOR')).toEqual(['dashboard', 'orders'])
  })
  it('shows catalog and inventory to product managers', () => {
    expect(visibleNavItems('PRODUCT_MANAGER')).toEqual(['dashboard', 'categories', 'brands', 'products', 'inventory'])
  })
  it('shows everything to owners', () => {
    expect(visibleNavItems('OWNER')).toEqual([
      'dashboard', 'categories', 'brands', 'products', 'inventory', 'orders', 'staff', 'audit',
    ])
  })
})
