import { Alert } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../api/client'

export function ErrorAlert({ error }: { error: unknown }) {
  const { i18n } = useTranslation()
  if (!error) return null
  const locale = i18n.language === 'en' ? 'en' : 'fa'
  const other = locale === 'fa' ? 'en' : 'fa'
  const text =
    error instanceof ApiError
      ? error.messages[locale] || error.messages[other]
      : error instanceof Error
        ? error.message
        : String(error)
  return <Alert severity="error">{text}</Alert>
}
