import { Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

// Task 19 replaces both tabs' content; until then they only show this note.
export function TabPlaceholder() {
  const { t } = useTranslation()
  return <Typography color="text.secondary">{t('common.comingSoon')}</Typography>
}
