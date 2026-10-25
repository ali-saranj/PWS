import { Button, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSetProductStatus } from '../../api/products'
import type { ProductDetailDto, ProductStatus } from '../../api/types'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ErrorAlert } from '../../components/ErrorAlert'
import { StatusChip } from './StatusChip'

interface Props {
  product: ProductDetailDto
  /** Unsaved edits would be replaced by the returned detail, so status changes wait for a save. */
  dirty: boolean
  onChanged: (detail: ProductDetailDto) => void
}

export function StatusControl({ product, dirty, onChanged }: Props) {
  const { t } = useTranslation()
  const setStatus = useSetProductStatus()
  const [confirmArchive, setConfirmArchive] = useState(false)

  const change = (status: ProductStatus) => {
    setConfirmArchive(false)
    setStatus.reset()
    setStatus.mutate({ id: product.id, status, version: product.version }, { onSuccess: onChanged })
  }
  const busy = setStatus.isPending || dirty

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2">{t('products.statusLabel')}</Typography>
        <StatusChip status={product.status} />
        {product.status !== 'ACTIVE' && (
          <Button size="small" variant="outlined" disabled={busy} onClick={() => change('ACTIVE')}>
            {t('products.publish')}
          </Button>
        )}
        {product.status === 'ACTIVE' && (
          <Button size="small" variant="outlined" disabled={busy} onClick={() => change('DRAFT')}>
            {t('products.unpublish')}
          </Button>
        )}
        {product.status === 'ARCHIVED' && (
          <Button size="small" variant="outlined" disabled={busy} onClick={() => change('DRAFT')}>
            {t('products.restore')}
          </Button>
        )}
        {product.status !== 'ARCHIVED' && (
          <Button size="small" color="warning" variant="outlined" disabled={busy} onClick={() => setConfirmArchive(true)}>
            {t('products.archive')}
          </Button>
        )}
        {dirty && <Typography variant="caption" color="text.secondary">{t('products.saveFirst')}</Typography>}
      </Stack>
      <ErrorAlert error={setStatus.error} />
      <ConfirmDialog
        open={confirmArchive}
        title={t('products.archiveTitle')}
        message={t('products.archiveMessage')}
        confirmLabel={t('products.archive')}
        onConfirm={() => change('ARCHIVED')}
        onCancel={() => setConfirmArchive(false)}
      />
    </Stack>
  )
}
