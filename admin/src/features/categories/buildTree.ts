import type { CategoryDto } from '../../api/types'

export type CategoryNode = CategoryDto & { children: CategoryNode[] }

function bySortThenId(a: CategoryDto, b: CategoryDto): number {
  return a.sortOrder - b.sortOrder || a.id - b.id
}

/** Nests a flat list by parentId; orphans (unknown parent) become roots. Siblings sort by sortOrder then id. */
export function buildTree(flat: CategoryDto[]): CategoryNode[] {
  const nodes = new Map<number, CategoryNode>()
  for (const c of flat) nodes.set(c.id, { ...c, children: [] })
  const roots: CategoryNode[] = []
  for (const node of nodes.values()) {
    const parent = node.parentId == null ? undefined : nodes.get(node.parentId)
    if (parent && parent !== node) parent.children.push(node)
    else roots.push(node)
  }
  const sort = (list: CategoryNode[]) => {
    list.sort(bySortThenId)
    list.forEach((n) => sort(n.children))
  }
  sort(roots)
  return roots
}

/** Ids of the category and all of its descendants. */
export function descendantIds(flat: CategoryDto[], id: number): Set<number> {
  const out = new Set<number>([id])
  let grew = true
  while (grew) {
    grew = false
    for (const c of flat) {
      if (c.parentId != null && out.has(c.parentId) && !out.has(c.id)) {
        out.add(c.id)
        grew = true
      }
    }
  }
  return out
}

/** Flattens the category tree depth-first, remembering each node's depth for indentation. */
export function flattenTree(nodes: CategoryNode[], depth = 0): { node: CategoryNode; depth: number }[] {
  return nodes.flatMap((n) => [{ node: n, depth }, ...flattenTree(n.children, depth + 1)])
}
