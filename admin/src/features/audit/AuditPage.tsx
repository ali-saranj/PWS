import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import {
  Box, Card, CardContent, CircularProgress, Collapse, IconButton, MenuItem, Stack, Table, TableBody, TableCell, TableHead,
  TablePagination, TableRow, TextField, Typography,
} from '@mui/material'
import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useAudit } from '../../api/audit'
import { useStaffList } from '../../api/staff'
import { ErrorAlert } from '../../components/ErrorAlert'
import { formatDateTime } from '../../lib/format'
import { JsonDiff } from './JsonDiff'

const SIZES = [20, 50, 100]
const ENTITY_TYPES = ['STAFF_USER', 'CATEGORY', 'BRAND', 'PRODUCT', 'VARIANT', 'PRODUCT_IMAGE', 'INVENTORY']

function num(v: string | null): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export default function AuditPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en' : 'fa'
  const [params, setParams] = useSearchParams()
  const entityParam = params.get('entityType')
  const filters = {
    entityType: entityParam && ENTITY_TYPES.includes(entityParam) ? entityParam : undefined,
    staffUserId: num(params.get('staffUserId')),
    page: Math.max(0, num(params.get('page')) ?? 0),
    size: SIZES.find((s) => s === num(params.get('size'))) ?? 20,
  }
  const { data, isLoading, error } = useAudit(filters)
  const staff = useStaffList()
  const [open, setOpen] = useState<Set<number>>(new Set())

  const patch = (changes: Record<string, string | undefined>, keepPage = false) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(changes)) {
          if (v === undefined || v === '') next.delete(k)
          else next.set(k, v)
        }
        if (!keepPage) next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  const toggle = (id: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 2 }}>{t('audit.title')}</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            select size="small" sx={{ minWidth: 200 }} label={t('audit.entityType')}
            value={filters.entityType ?? ''}
            onChange={(e) => patch({ entityType: e.target.value })}
          >
            <MenuItem value="">{t('audit.all')}</MenuItem>
            {ENTITY_TYPES.map((e) => (
              <MenuItem key={e} value={e}>{t(`audit.entityTypes.${e}`)}</MenuItem>
            ))}
          </TextField>
          <TextField
            select size="small" sx={{ minWidth: 200 }} label={t('audit.staffMember')}
            value={filters.staffUserId != null && staff.data?.some((s) => s.id === filters.staffUserId) ? String(filters.staffUserId) : ''}
            onChange={(e) => patch({ staffUserId: e.target.value })}
          >
            <MenuItem value="">{t('audit.all')}</MenuItem>
            {(staff.data ?? []).map((s) => (
              <MenuItem key={s.id} value={String(s.id)}>{s.username}</MenuItem>
            ))}
          </TextField>
        </Stack>
        <ErrorAlert error={error} />
        {isLoading && <CircularProgress aria-label={t('common.loading')} />}
        {data && data.items.length === 0 && <Typography color="text.secondary">{t('common.empty')}</Typography>}
        {data && data.items.length > 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>{t('audit.date')}</TableCell>
                  <TableCell>{t('audit.staff')}</TableCell>
                  <TableCell>{t('audit.action')}</TableCell>
                  <TableCell>{t('audit.entityType')}</TableCell>
                  <TableCell>{t('audit.entityId')}</TableCell>
                  <TableCell>{t('audit.ip')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((e) => {
                  const expanded = open.has(e.id)
                  return (
                    <Fragment key={e.id}>
                      <TableRow>
                        <TableCell>
                          <IconButton size="small" aria-expanded={expanded} aria-label={t('audit.showChanges', { id: e.id })} onClick={() => toggle(e.id)}>
                            {expanded ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(e.createdAt, locale)}</TableCell>
                        <TableCell>{e.staffUsername ?? '—'}</TableCell>
                        <TableCell dir="ltr" sx={{ textAlign: 'start' }}>{e.action}</TableCell>
                        <TableCell>{t(`audit.entityTypes.${e.entityType}`, { defaultValue: e.entityType })}</TableCell>
                        <TableCell>{e.entityId ?? '—'}</TableCell>
                        <TableCell dir="ltr" sx={{ textAlign: 'start' }}>{e.ip ?? '—'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 0, borderBottom: expanded ? undefined : 0 }}>
                          <Collapse in={expanded} unmountOnExit>
                            <Box sx={{ py: 1 }}>
                              <JsonDiff before={e.before} after={e.after} />
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        )}
        {data && (
          <TablePagination
            component="div"
            count={data.total}
            page={data.page}
            rowsPerPage={data.size}
            rowsPerPageOptions={SIZES}
            labelRowsPerPage={t('products.rowsPerPage')}
            onPageChange={(_, p) => patch({ page: String(p) }, true)}
            onRowsPerPageChange={(e) => patch({ size: e.target.value })}
          />
        )}
      </CardContent>
    </Card>
  )
}
