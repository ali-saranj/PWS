import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router'
import type { StaffRole } from '../api/types'
import { useAuth } from './AuthContext'

export function RequireRole({ roles, children }: { roles: StaffRole[]; children: ReactNode }) {
  const { staff } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()
  if (!staff) return <Navigate to="/login" replace state={{ from: location }} />
  if (!roles.includes(staff.role)) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          {t('auth.noAccessTitle')}
        </Typography>
        <Typography color="text.secondary">{t('auth.noAccessBody')}</Typography>
      </Box>
    )
  }
  return <>{children}</>
}
