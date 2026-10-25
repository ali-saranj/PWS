import AssessmentIcon from '@mui/icons-material/Assessment'
import CategoryIcon from '@mui/icons-material/Category'
import DashboardIcon from '@mui/icons-material/Dashboard'
import GroupIcon from '@mui/icons-material/Group'
import InventoryIcon from '@mui/icons-material/Inventory'
import LabelIcon from '@mui/icons-material/Label'
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'
import type { ElementType } from 'react'
import type { StaffRole } from '../api/types'

export type NavKey = 'dashboard' | 'categories' | 'brands' | 'products' | 'inventory' | 'staff' | 'audit'

export interface NavItem {
  key: NavKey
  path: string
  roles: StaffRole[]
  icon: ElementType
}

const ALL: StaffRole[] = ['OWNER', 'PRODUCT_MANAGER', 'ORDER_OPERATOR']
const CATALOG: StaffRole[] = ['OWNER', 'PRODUCT_MANAGER']
const OWNER: StaffRole[] = ['OWNER']

export const navItems: NavItem[] = [
  { key: 'dashboard', path: '/', roles: ALL, icon: DashboardIcon },
  { key: 'categories', path: '/categories', roles: CATALOG, icon: CategoryIcon },
  { key: 'brands', path: '/brands', roles: CATALOG, icon: LabelIcon },
  { key: 'products', path: '/products', roles: CATALOG, icon: ShoppingBagIcon },
  { key: 'inventory', path: '/inventory', roles: CATALOG, icon: InventoryIcon },
  { key: 'staff', path: '/staff', roles: OWNER, icon: GroupIcon },
  { key: 'audit', path: '/audit', roles: OWNER, icon: AssessmentIcon },
]

export function visibleNavItems(role: StaffRole): NavKey[] {
  return navItems.filter((i) => i.roles.includes(role)).map((i) => i.key)
}
