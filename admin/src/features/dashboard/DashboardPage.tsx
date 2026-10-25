import { Card, CardContent, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthContext'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { staff } = useAuth()
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {t('dashboard.welcome', { name: staff?.fullName })}
        </Typography>
        <Typography color="text.secondary">{t('dashboard.hint')}</Typography>
      </CardContent>
    </Card>
  )
}
