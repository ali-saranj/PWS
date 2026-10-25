import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { IconButton, InputAdornment, TextField, type TextFieldProps } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PASSWORD_MAX_BYTES, PASSWORD_MIN, passwordBytes } from '../../lib/password'

export function usePasswordRules() {
  const { t } = useTranslation()
  return {
    required: t('validation.required'),
    validate: (s: string) =>
      s.length < PASSWORD_MIN
        ? t('validation.passwordMin', { min: PASSWORD_MIN })
        : passwordBytes(s) > PASSWORD_MAX_BYTES
          ? t('validation.passwordMax', { max: PASSWORD_MAX_BYTES })
          : true,
  }
}

/** Password input with a show/hide toggle; spread react-hook-form's register() result into it. */
export function PasswordField(props: TextFieldProps) {
  const { t } = useTranslation()
  const [shown, setShown] = useState(false)
  return (
    <TextField
      {...props}
      type={shown ? 'text' : 'password'}
      autoComplete="new-password"
      slotProps={{
        htmlInput: { dir: 'ltr' },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                aria-label={shown ? t('staff.hidePassword') : t('staff.showPassword')}
                onClick={() => setShown((s) => !s)}
              >
                {shown ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
