import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  open: boolean
  title: string
  message?: string
  extra?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  extra,
  confirmLabel,
  cancelLabel,
  destructive,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      {(message || extra) && (
        <DialogContent>
          {message && <DialogContentText>{message}</DialogContentText>}
          {extra}
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          {cancelLabel ?? t('common.cancel')}
        </Button>
        <Button onClick={onConfirm} disabled={loading} color={destructive ? 'error' : 'primary'} variant="contained">
          {confirmLabel ?? t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
