import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { Page } from './types'

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'PREPARING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'

export type PaymentStatus = 'INITIATED' | 'PAID' | 'FAILED' | 'EXPIRED'
export type ActorType = 'CUSTOMER' | 'STAFF' | 'SYSTEM'

export interface CustomerDto {
  id: number
  mobile: string
  firstName: string | null
  lastName: string | null
}

export interface DeliveryAddressDto {
  province: string
  city: string
  addressLine: string
  postalCode: string
  recipientName: string
  recipientMobile: string
}

export interface AdminOrderItemResponse {
  id: number
  variantId: number
  productNameFa: string
  productNameEn: string | null
  variantLabelFa: string | null
  variantLabelEn: string | null
  sku: string
  unitPrice: number
  qty: number
  lineTotal: number
}

export interface PaymentDetailDto {
  gateway: string | null
  refId: string | null
  cardPanMasked: string | null
  status: PaymentStatus | null
  amount: number | null
}

export interface OrderStatusHistoryDto {
  id: number
  fromStatus: OrderStatus | null
  toStatus: OrderStatus
  actorType: ActorType
  actorId: number | null
  note: string | null
  createdAt: string
}

export interface AdminOrderSummaryResponse {
  id: number
  orderNumber: string
  trackingCode: string
  customerMobile: string
  recipientName: string
  totalRials: number
  status: OrderStatus
  placedAt: string
  needsAttention: boolean
  itemCount: number
}

export interface AdminOrderDetailResponse {
  id: number
  orderNumber: string
  trackingCode: string
  status: OrderStatus
  customer: CustomerDto | null
  deliveryAddress: DeliveryAddressDto | null
  items: AdminOrderItemResponse[]
  subtotalRials: number
  shippingCostRials: number
  discountTotalRials: number
  totalRials: number
  payment: PaymentDetailDto | null
  courierNotes: string | null
  adminNotes: string | null
  needsAttention: boolean
  placedAt: string
  paidAt: string | null
  createdAt: string
  updatedAt: string
  statusHistory: OrderStatusHistoryDto[]
}

export interface OrderStatusTransitionRequest {
  targetStatus: OrderStatus | string
  note?: string | null
  courierNotes?: string | null
}

export interface OrderFilters {
  status?: string
  q?: string
  page?: number
  size?: number
}

export function listOrders(params: OrderFilters = {}): Promise<Page<AdminOrderSummaryResponse>> {
  const p = new URLSearchParams()
  if (params.status) p.set('status', params.status)
  if (params.q) p.set('q', params.q)
  if (params.page != null) p.set('page', String(params.page))
  if (params.size != null) p.set('size', String(params.size))
  const qs = p.toString()
  return apiFetch<Page<AdminOrderSummaryResponse>>(`/api/admin/orders${qs ? `?${qs}` : ''}`)
}

export function getOrder(id: number): Promise<AdminOrderDetailResponse> {
  return apiFetch<AdminOrderDetailResponse>(`/api/admin/orders/${id}`)
}

export function transitionOrderStatus(
  id: number,
  data: OrderStatusTransitionRequest,
): Promise<AdminOrderDetailResponse> {
  return apiFetch<AdminOrderDetailResponse>(`/api/admin/orders/${id}/status`, {
    method: 'POST',
    json: data,
  })
}

export function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => listOrders(filters),
    placeholderData: keepPreviousData,
  })
}

export function useOrder(id: number | null) {
  return useQuery({
    queryKey: ['order', id],
    enabled: id != null,
    queryFn: () => getOrder(id!),
  })
}

export function useTransitionOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: OrderStatusTransitionRequest }) =>
      transitionOrderStatus(id, data),
    onSuccess: (updated) => {
      void Promise.all([
        qc.invalidateQueries({ queryKey: ['orders'] }),
        qc.setQueryData(['order', updated.id], updated),
      ])
    },
  })
}
