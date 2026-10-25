import { describe, expect, it } from 'vitest'
import type { CategoryDto } from '../../api/types'
import { buildTree, descendantIds } from './buildTree'

const c = (id: number, parentId: number | null, sortOrder = 0): CategoryDto => ({
  id,
  parentId,
  nameFa: `c${id}`,
  nameEn: null,
  slug: `c${id}`,
  sortOrder,
  active: true,
})

describe('buildTree', () => {
  it('nests and sorts', () => {
    const tree = buildTree([c(3, 1, 2), c(2, 1, 1), c(1, null, 5), c(4, null, 1), c(5, 2, 0)])
    expect(tree.map((n) => n.id)).toEqual([4, 1])
    expect(tree[1].children.map((n) => n.id)).toEqual([2, 3])
    expect(tree[1].children[0].children.map((n) => n.id)).toEqual([5])
  })

  it('breaks sortOrder ties by id', () => {
    expect(buildTree([c(9, null), c(2, null)]).map((n) => n.id)).toEqual([2, 9])
  })

  it('tolerates orphan parentId (treated as root)', () => {
    const tree = buildTree([c(1, null), c(2, 99)])
    expect(tree.map((n) => n.id)).toEqual([1, 2])
  })
})

describe('descendantIds', () => {
  it('includes self and all descendants', () => {
    const flat = [c(1, null), c(2, 1), c(3, 2), c(4, null)]
    expect([...descendantIds(flat, 1)].sort()).toEqual([1, 2, 3])
  })
})
