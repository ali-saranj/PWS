import { Chip } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { ProductStatus } from '../../api/types'

const STATUS_COLOR: Record<ProductStatus, 'default' | 'success' | 'warning'> = {
  DRAFT: 'default',
  ACTIVE: 'success',
  ARCHIVED: 'warning',
}

export function StatusChip({ status }: { status: ProductStatus }) {
  const { t } = useTranslation()
  return <Chip size="small" color={STATUS_COLOR[status]} label={t(`products.status.${status}`)} />
}
