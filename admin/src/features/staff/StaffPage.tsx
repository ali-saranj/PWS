import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import KeyIcon from '@mui/icons-material/Key'
import { Button, Card, CardContent, Chip, CircularProgress, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography, Box } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStaffList } from '../../api/staff'
import type { StaffDto } from '../../api/types'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PasswordDialog } from './PasswordDialog'
import { StaffDialog } from './StaffDialog'

export default function StaffPage() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useStaffList()
  const [dialog, setDialog] = useState<{ staff: StaffDto | null } | null>(null)
  const [resetFor, setResetFor] = useState<StaffDto | null>(null)

  return (
    <Card>
      <CardContent>
        <Stack direction="row" sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">{t('staff.title')}</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ staff: null })}>
            {t('staff.add')}
          </Button>
        </Stack>
        <ErrorAlert error={error} />
        {isLoading && <CircularProgress aria-label={t('common.loading')} />}
        {data && data.length === 0 && <Typography color="text.secondary">{t('common.empty')}</Typography>}
        {data && data.length > 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('staff.username')}</TableCell>
                  <TableCell>{t('staff.fullName')}</TableCell>
                  <TableCell>{t('staff.mobile')}</TableCell>
                  <TableCell>{t('staff.role')}</TableCell>
                  <TableCell>{t('form.active')}</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell dir="ltr" sx={{ textAlign: 'start' }}>{s.username}</TableCell>
                    <TableCell>{s.fullName}</TableCell>
                    <TableCell dir="ltr" sx={{ textAlign: 'start' }}>{s.mobile}</TableCell>
                    <TableCell>{t(`staff.roles.${s.role}`)}</TableCell>
                    <TableCell>
                      <Chip size="small" color={s.active ? 'success' : 'default'} label={s.active ? t('common.active') : t('common.inactive')} />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title={t('common.edit')}>
                        <IconButton aria-label={`${t('common.edit')}: ${s.username}`} onClick={() => setDialog({ staff: s })}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('staff.resetPassword')}>
                        <IconButton aria-label={`${t('staff.resetPassword')}: ${s.username}`} onClick={() => setResetFor(s)}>
                          <KeyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
      {dialog && <StaffDialog staff={dialog.staff} onClose={() => setDialog(null)} />}
      {resetFor && <PasswordDialog staff={resetFor} onClose={() => setResetFor(null)} />}
    </Card>
  )
}
