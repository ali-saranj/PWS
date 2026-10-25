import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/client'
import { useResetPassword } from '../../api/staff'
import type { StaffDto } from '../../api/types'
import { ErrorAlert } from '../../components/ErrorAlert'
import { applyFieldErrors } from '../../lib/forms'
import { PasswordField, usePasswordRules } from './PasswordField'

export function PasswordDialog({ staff, onClose }: { staff: StaffDto; onClose: () => void }) {
  const { t } = useTranslation()
  const reset = useResetPassword()
  const rules = usePasswordRules()
  const [formError, setFormError] = useState<unknown>(null)
  const { register, handleSubmit, setError, formState: { errors } } = useForm<{ password: string }>({ defaultValues: { password: '' } })

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null)
    try {
      await reset.mutateAsync({ id: staff.id, body: { password: v.password } })
      onClose()
    } catch (e) {
      setFormError(e instanceof ApiError ? applyFieldErrors(e, setError, ['password']) : e)
    }
  })

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>{t('staff.resetPassword')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <DialogContentText>{t('staff.resetHint', { name: staff.username })}</DialogContentText>
            <ErrorAlert error={formError} />
            <PasswordField
              label={t('staff.newPassword')}
              {...register('password', rules)}
              error={!!errors.password}
              helperText={errors.password?.message}
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={reset.isPending}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={reset.isPending}>{t('staff.resetPassword')}</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
