import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  InputAdornment,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useOrders, type OrderFilters } from '../../api/orders'
import { ErrorAlert } from '../../components/ErrorAlert'
import { formatDateTime, formatToman, type Locale } from '../../lib/format'
import { OrderDetailDialog } from './OrderDetailDialog'
import { OrderStatusChip } from './OrderStatusChip'

const TABS = [
  { key: 'ALL', status: undefined },
  { key: 'AWAITING_APPROVAL', status: 'AWAITING_APPROVAL' },
  { key: 'PREPARING', status: 'PREPARING' },
  { key: 'DISPATCHED', status: 'DISPATCHED' },
  { key: 'DELIVERED', status: 'DELIVERED' },
  { key: 'CANCELLED', status: 'CANCELLED' },
] as const

const SIZES = [20, 50, 100]

function num(v: string | null): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export default function OrdersPage() {
  const { t, i18n } = useTranslation()
  const locale: Locale = i18n.language === 'en' ? 'en' : 'fa'
  const [params, setParams] = useSearchParams()

  const currentStatusParam = params.get('status') || undefined
  const activeTabKey = TABS.find((t) => t.status === currentStatusParam)?.key ?? 'ALL'

  const size = SIZES.find((s) => s === num(params.get('size'))) ?? 20
  const page = Math.max(0, num(params.get('page')) ?? 0)

  const filters: OrderFilters = {
    q: params.get('q') || undefined,
    status: currentStatusParam,
    page,
    size,
  }

  const { data, isLoading, error } = useOrders(filters)
  const [search, setSearch] = useState(filters.q ?? '')
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

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

  useEffect(() => {
    if (search === (filters.q ?? '')) return
    const timer = setTimeout(() => patch({ q: search.trim() }), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleTabChange = (_: React.SyntheticEvent, newTabKey: string) => {
    const target = TABS.find((t) => t.key === newTabKey)
    patch({ status: target?.status })
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 2 }}>
          {t('orders.title')}
        </Typography>

        {/* Status Filter Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTabKey}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.key}
                value={tab.key}
                label={t(`orders.tabs.${tab.key}`)}
              />
            ))}
          </Tabs>
        </Box>

        {/* Search Input */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            size="small"
            label={t('orders.search')}
            placeholder={t('orders.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ maxWidth: 400 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>

        <ErrorAlert error={error} />

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress aria-label={t('common.loading')} />
          </Box>
        )}

        {data && data.items.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            {t('common.empty')}
          </Typography>
        )}

        {data && data.items.length > 0 && (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('orders.orderNumber')}</TableCell>
                    <TableCell>{t('orders.trackingCode')}</TableCell>
                    <TableCell>{t('orders.customerMobile')}</TableCell>
                    <TableCell>{t('orders.recipient')}</TableCell>
                    <TableCell align="right">{t('orders.total')}</TableCell>
                    <TableCell>{t('orders.statusHeader')}</TableCell>
                    <TableCell>{t('orders.placedAt')}</TableCell>
                    <TableCell align="center">{t('orders.actionsHeader')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.items.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell sx={{ fontWeight: 'medium' }}>{order.orderNumber}</TableCell>
                      <TableCell>{order.trackingCode}</TableCell>
                      <TableCell>{order.customerMobile}</TableCell>
                      <TableCell>{order.recipientName}</TableCell>
                      <TableCell align="right">{formatToman(order.totalRials, locale)}</TableCell>
                      <TableCell>
                        <OrderStatusChip status={order.status} />
                      </TableCell>
                      <TableCell>{formatDateTime(order.placedAt, locale)}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          {t('orders.view')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={data.total}
              page={filters.page ?? 0}
              rowsPerPage={filters.size ?? 20}
              rowsPerPageOptions={SIZES}
              onPageChange={(_, newPage) => patch({ page: String(newPage) }, true)}
              onRowsPerPageChange={(e) => patch({ size: e.target.value })}
            />
          </>
        )}

        {selectedOrderId != null && (
          <OrderDetailDialog
            orderId={selectedOrderId}
            open={true}
            onClose={() => setSelectedOrderId(null)}
          />
        )}
      </CardContent>
    </Card>
  )
}
