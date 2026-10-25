import { CircularProgress, Drawer, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, Typography, Box } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMovements } from '../../api/inventory'
import { ErrorAlert } from '../../components/ErrorAlert'
import { formatDate, formatNumber } from '../../lib/format'

interface Props {
  variantId: number | null
  title: string
  onClose: () => void
}

const SIZE = 20

export function MovementsDrawer({ variantId, title, onClose }: Props) {
  return (
    <Drawer anchor="right" open={variantId != null} onClose={onClose}>
      {variantId != null && <MovementsContent key={variantId} variantId={variantId} title={title} />}
    </Drawer>
  )
}

function MovementsContent({ variantId, title }: { variantId: number; title: string }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en' : 'fa'
  const [page, setPage] = useState(0)
  const { data, isLoading, error } = useMovements(variantId, page, SIZE)

  return (
    <>
      <Box sx={{ width: { xs: '100vw', sm: 520 }, p: 2 }}>
        <Typography variant="h6">{t('inventory.history')}</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>{title}</Typography>
        <ErrorAlert error={error} />
        {isLoading && <CircularProgress aria-label={t('common.loading')} />}
        {data && data.items.length === 0 && <Typography color="text.secondary">{t('common.empty')}</Typography>}
        {data && data.items.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('inventory.date')}</TableCell>
                <TableCell>{t('inventory.change')}</TableCell>
                <TableCell>{t('inventory.reason')}</TableCell>
                <TableCell>{t('inventory.staff')}</TableCell>
                <TableCell>{t('inventory.note')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{formatDate(m.createdAt, locale)}</TableCell>
                  <TableCell dir="ltr" sx={{ textAlign: 'start' }}>{m.delta > 0 ? '+' : ''}{formatNumber(m.delta, locale)}</TableCell>
                  <TableCell>{t(`inventory.reasons.${m.reason}`)}</TableCell>
                  <TableCell>{m.staffUsername ?? '—'}</TableCell>
                  <TableCell>{m.note ?? ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {data && (
          <TablePagination
            component="div"
            count={data.total}
            page={data.page}
            rowsPerPage={SIZE}
            rowsPerPageOptions={[SIZE]}
            onPageChange={(_, p) => setPage(p)}
          />
        )}
      </Box>
    </>
  )
}
