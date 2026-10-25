import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, Switch, TextField } from '@mui/material'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/client'
import { useSaveStaff } from '../../api/staff'
import type { StaffDto, StaffRole } from '../../api/types'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ErrorAlert } from '../../components/ErrorAlert'
import { useAuth } from '../../auth/AuthContext'
import { applyFieldErrors } from '../../lib/forms'
import { toLatinDigits } from '../../lib/format'
import { PasswordField, usePasswordRules } from './PasswordField'

export const ROLES: StaffRole[] = ['OWNER', 'PRODUCT_MANAGER', 'ORDER_OPERATOR']

interface FormValues {
  username: string
  password: string
  fullName: string
  mobile: string
  role: StaffRole
  active: boolean
}

const FIELDS = ['username', 'password', 'fullName', 'mobile', 'role', 'active']

/** staff is null when creating. */
export function StaffDialog({ staff, onClose }: { staff: StaffDto | null; onClose: () => void }) {
  const { t } = useTranslation()
  const { staff: me } = useAuth()
  const save = useSaveStaff()
  const passwordRules = usePasswordRules()
  const [formError, setFormError] = useState<unknown>(null)
  const [pendingSelf, setPendingSelf] = useState<FormValues | null>(null)

  const { register, control, handleSubmit, setError, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      username: '',
      password: '',
      fullName: staff?.fullName ?? '',
      mobile: staff?.mobile ?? '',
      role: staff?.role ?? 'PRODUCT_MANAGER',
      active: staff?.active ?? true,
    },
  })

  const submit = async (v: FormValues) => {
    setFormError(null)
    const common = { fullName: v.fullName.trim(), mobile: toLatinDigits(v.mobile).trim(), role: v.role }
    try {
      if (staff) {
        await save.mutateAsync({ id: staff.id, body: { ...common, active: v.active, version: staff.version } })
      } else {
        await save.mutateAsync({ body: { ...common, username: v.username.trim(), password: v.password } })
      }
      onClose()
    } catch (e) {
      setFormError(e instanceof ApiError ? applyFieldErrors(e, setError, FIELDS) : e)
    }
  }

  const onSubmit = handleSubmit((v) => {
    const riskySelf = staff != null && me?.id === staff.id && ((staff.role === 'OWNER' && v.role !== 'OWNER') || (staff.active && !v.active))
    if (riskySelf) setPendingSelf(v)
    else void submit(v)
  })

  const required = { validate: (s: string) => s.trim() !== '' || t('validation.required') }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>{staff ? t('staff.edit') : t('staff.create')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <ErrorAlert error={formError} />
            {!staff && (
              <TextField
                label={t('staff.username')}
                {...register('username', required)}
                error={!!errors.username}
                helperText={errors.username?.message ?? t('staff.usernameHint')}
                slotProps={{ htmlInput: { dir: 'ltr', autoCapitalize: 'none' } }}
                autoFocus
              />
            )}
            {!staff && (
              <PasswordField
                label={t('staff.password')}
                {...register('password', passwordRules)}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            )}
            <TextField label={t('staff.fullName')} {...register('fullName', required)} error={!!errors.fullName} helperText={errors.fullName?.message} />
            <TextField
              label={t('staff.mobile')}
              {...register('mobile', required)}
              error={!!errors.mobile}
              helperText={errors.mobile?.message}
              slotProps={{ htmlInput: { dir: 'ltr', inputMode: 'tel' } }}
            />
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <TextField select label={t('staff.role')} {...field} error={!!errors.role} helperText={errors.role?.message}>
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>{t(`staff.roles.${r}`)}</MenuItem>
                  ))}
                </TextField>
              )}
            />
            {staff && (
              <Controller
                control={control}
                name="active"
                render={({ field }) => (
                  <Stack>
                    <FormControlLabel
                      control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                      label={t('form.active')}
                    />
                    {errors.active && <span role="alert" style={{ color: 'var(--mui-palette-error-main, #d32f2f)', fontSize: 12 }}>{errors.active.message}</span>}
                  </Stack>
                )}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={save.isPending}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={save.isPending}>{t('common.save')}</Button>
        </DialogActions>
      </form>
      <ConfirmDialog
        open={pendingSelf != null}
        title={t('staff.selfTitle')}
        message={t('staff.selfWarning')}
        destructive
        loading={save.isPending}
        onCancel={() => setPendingSelf(null)}
        onConfirm={() => {
          const v = pendingSelf
          setPendingSelf(null)
          if (v) void submit(v)
        }}
      />
    </Dialog>
  )
}
