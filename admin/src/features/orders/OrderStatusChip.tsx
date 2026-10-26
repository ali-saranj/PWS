import { Chip } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { OrderStatus } from '../../api/orders'

const STATUS_COLOR: Record<OrderStatus, 'default' | 'warning' | 'info' | 'secondary' | 'primary' | 'success' | 'error'> = {
  PENDING_PAYMENT: 'default',
  AWAITING_APPROVAL: 'warning',
  APPROVED: 'info',
  PREPARING: 'secondary',
  DISPATCHED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'error',
}

interface OrderStatusChipProps {
  status: OrderStatus
  size?: 'small' | 'medium'
}

export function OrderStatusChip({ status, size = 'small' }: OrderStatusChipProps) {
  const { t } = useTranslation()
  const color = STATUS_COLOR[status] ?? 'default'
  return <Chip size={size} color={color} label={t(`orders.status.${status}`, status)} />
}
