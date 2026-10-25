// Temporary "coming soon" pages. Tasks 17-21 replace the routes that use these; delete this file once none remain.
import { Card, CardContent, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

export function ComingSoon({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {t(titleKey)}
        </Typography>
        <Typography color="text.secondary">{t('common.comingSoon')}</Typography>
      </CardContent>
    </Card>
  )
}
