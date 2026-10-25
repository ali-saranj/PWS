import { createBrowserRouter, type RouteObject } from 'react-router'
import type { ReactNode } from 'react'
import type { StaffRole } from './api/types'
import { AuthRoot } from './auth/AuthContext'
import LoginPage from './auth/LoginPage'
import { RequireRole } from './auth/RequireRole'
import BrandsPage from './features/brands/BrandsPage'
import CategoriesPage from './features/categories/CategoriesPage'
import DashboardPage from './features/dashboard/DashboardPage'
import ProductEditorPage from './features/products/ProductEditorPage'
import ProductListPage from './features/products/ProductListPage'
import InventoryPage from './features/inventory/InventoryPage'
import AuditPage from './features/audit/AuditPage'
import StaffPage from './features/staff/StaffPage'
import AppLayout from './layout/AppLayout'

const ALL: StaffRole[] = ['OWNER', 'PRODUCT_MANAGER', 'ORDER_OPERATOR']
const CATALOG: StaffRole[] = ['OWNER', 'PRODUCT_MANAGER']
const OWNER: StaffRole[] = ['OWNER']

function guarded(roles: StaffRole[], element: ReactNode) {
  return <RequireRole roles={roles}>{element}</RequireRole>
}

export const routes: RouteObject[] = [
  {
    element: <AuthRoot />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: guarded(ALL, <AppLayout />),
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'categories', element: guarded(CATALOG, <CategoriesPage />) },
          { path: 'brands', element: guarded(CATALOG, <BrandsPage />) },
          { path: 'products', element: guarded(CATALOG, <ProductListPage />) },
          { path: 'products/new', element: guarded(CATALOG, <ProductEditorPage />) },
          { path: 'products/:id', element: guarded(CATALOG, <ProductEditorPage />) },
          { path: 'inventory', element: guarded(CATALOG, <InventoryPage />) },
          { path: 'staff', element: guarded(OWNER, <StaffPage />) },
          { path: 'audit', element: guarded(OWNER, <AuditPage />) },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
