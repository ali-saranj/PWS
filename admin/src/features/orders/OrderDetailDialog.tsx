import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOrder, useTransitionOrderStatus } from '../../api/orders'
import { ErrorAlert } from '../../components/ErrorAlert'
import { formatDateTime, formatToman, type Locale } from '../../lib/format'
import { OrderStatusChip } from './OrderStatusChip'

interface OrderDetailDialogProps {
  orderId: number | null
  open: boolean
  onClose: () => void
}

export function OrderDetailDialog({ orderId, open, onClose }: OrderDetailDialogProps) {
  const { t, i18n } = useTranslation()
  const locale: Locale = i18n.language === 'en' ? 'en' : 'fa'
  const { data: order, isLoading, error } = useOrder(orderId)
  const transitionMutation = useTransitionOrderStatus()

  const [dispatchPromptOpen, setDispatchPromptOpen] = useState(false)
  const [courierNotes, setCourierNotes] = useState('')
  const [cancelPromptOpen, setCancelPromptOpen] = useState(false)
  const [cancelNote, setCancelNote] = useState('')

  const handleApprove = () => {
    if (!order) return
    transitionMutation.mutate({
      id: order.id,
      data: { targetStatus: 'APPROVED' },
    })
  }

  const handleStartPreparing = () => {
    if (!order) return
    transitionMutation.mutate({
      id: order.id,
      data: { targetStatus: 'PREPARING' },
    })
  }

  const handleOpenDispatchPrompt = () => {
    setCourierNotes('')
    setDispatchPromptOpen(true)
  }

  const handleConfirmDispatch = () => {
    if (!order) return
    transitionMutation.mutate(
      {
        id: order.id,
        data: {
          targetStatus: 'DISPATCHED',
          courierNotes: courierNotes.trim() || undefined,
        },
      },
      {
        onSuccess: () => setDispatchPromptOpen(false),
      },
    )
  }

  const handleMarkDelivered = () => {
    if (!order) return
    transitionMutation.mutate({
      id: order.id,
      data: { targetStatus: 'DELIVERED' },
    })
  }

  const handleOpenCancelPrompt = () => {
    setCancelNote('')
    setCancelPromptOpen(true)
  }

  const handleConfirmCancel = () => {
    if (!order) return
    transitionMutation.mutate(
      {
        id: order.id,
        data: {
          targetStatus: 'CANCELLED',
          note: cancelNote.trim() || undefined,
        },
      },
      {
        onSuccess: () => setCancelPromptOpen(false),
      },
    )
  }

  const productName = (fa: string, en: string | null) => (locale === 'fa' ? fa : en || fa)
  const variantLabel = (fa: string | null, en: string | null) => (locale === 'fa' ? fa || '' : en || fa || '')

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Typography variant="h6">{order ? order.orderNumber : t('orders.detail')}</Typography>
            {order && <OrderStatusChip status={order.status} />}
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <ErrorAlert error={error || transitionMutation.error} />
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress aria-label={t('common.loading')} />
            </Box>
          )}

          {order && (
            <Stack spacing={3}>
              {/* Order Meta & Customer Info */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('orders.info')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{t('orders.orderNumber')}:</strong> {order.orderNumber}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{t('orders.trackingCode')}:</strong> {order.trackingCode}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{t('orders.placedAt')}:</strong> {formatDateTime(order.placedAt, locale)}
                  </Typography>
                  {order.paidAt && (
                    <Typography variant="body2">
                      <strong>{t('orders.paidAt')}:</strong> {formatDateTime(order.paidAt, locale)}
                    </Typography>
                  )}
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('orders.customer')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{t('orders.customerName')}:</strong>{' '}
                    {order.customer
                      ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || '—'
                      : '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{t('orders.customerPhone')}:</strong> {order.customer?.mobile || '—'}
                  </Typography>
                </Paper>
              </Box>

              {/* Delivery Address Snapshot */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('orders.deliveryAddress')}
                </Typography>
                {order.deliveryAddress ? (
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      <strong>{t('orders.recipient')}:</strong> {order.deliveryAddress.recipientName} (
                      {order.deliveryAddress.recipientMobile})
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('orders.address')}:</strong> {order.deliveryAddress.province},{' '}
                      {order.deliveryAddress.city}, {order.deliveryAddress.addressLine}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('orders.postalCode')}:</strong> {order.deliveryAddress.postalCode}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    —
                  </Typography>
                )}
              </Paper>

              {/* Line Items */}
              <div>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('orders.items')}
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('orders.product')}</TableCell>
                        <TableCell>{t('orders.sku')}</TableCell>
                        <TableCell align="right">{t('orders.unitPrice')}</TableCell>
                        <TableCell align="center">{t('orders.quantity')}</TableCell>
                        <TableCell align="right">{t('orders.lineTotal')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {productName(item.productNameFa, item.productNameEn)}
                            </Typography>
                            {(item.variantLabelFa || item.variantLabelEn) && (
                              <Typography variant="caption" color="text.secondary">
                                {variantLabel(item.variantLabelFa, item.variantLabelEn)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell align="right">{formatToman(item.unitPrice, locale)}</TableCell>
                          <TableCell align="center">{item.qty}</TableCell>
                          <TableCell align="right">{formatToman(item.lineTotal, locale)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>

              {/* Financials & Payment Details */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('orders.payment')}
                  </Typography>
                  {order.payment ? (
                    <Stack spacing={0.5}>
                      <Typography variant="body2">
                        <strong>{t('orders.gateway')}:</strong> {order.payment.gateway || '—'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>{t('orders.refId')}:</strong> {order.payment.refId || '—'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>{t('orders.cardPan')}:</strong> {order.payment.cardPanMasked || '—'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>{t('orders.paymentStatus')}:</strong> {order.payment.status || '—'}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {t('orders.noPaymentDetails')}
                    </Typography>
                  )}
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('orders.totals')}
                  </Typography>
                  <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{t('orders.subtotal')}:</Typography>
                      <Typography variant="body2">{formatToman(order.subtotalRials, locale)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{t('orders.shippingCost')}:</Typography>
                      <Typography variant="body2">{formatToman(order.shippingCostRials, locale)}</Typography>
                    </Box>
                    {order.discountTotalRials > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">{t('orders.discount')}:</Typography>
                        <Typography variant="body2" color="error">
                          -{formatToman(order.discountTotalRials, locale)}
                        </Typography>
                      </Box>
                    )}
                    <Divider sx={{ my: 0.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {t('orders.total')}:
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {formatToman(order.totalRials, locale)}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>

              {/* Notes if available */}
              {(order.courierNotes || order.adminNotes) && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('orders.notes')}
                  </Typography>
                  {order.courierNotes && (
                    <Typography variant="body2">
                      <strong>{t('orders.courierNotes')}:</strong> {order.courierNotes}
                    </Typography>
                  )}
                  {order.adminNotes && (
                    <Typography variant="body2">
                      <strong>{t('orders.adminNotes')}:</strong> {order.adminNotes}
                    </Typography>
                  )}
                </Paper>
              )}

              {/* Chronological Status History */}
              <div>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('orders.statusHistory')}
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('orders.historyDate')}</TableCell>
                        <TableCell>{t('orders.historyFrom')}</TableCell>
                        <TableCell>{t('orders.historyTo')}</TableCell>
                        <TableCell>{t('orders.historyActor')}</TableCell>
                        <TableCell>{t('orders.historyNote')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.statusHistory.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell>{formatDateTime(h.createdAt, locale)}</TableCell>
                          <TableCell>
                            {h.fromStatus ? <OrderStatusChip status={h.fromStatus} size="small" /> : '—'}
                          </TableCell>
                          <TableCell>
                            <OrderStatusChip status={h.toStatus} size="small" />
                          </TableCell>
                          <TableCell>{h.actorType}</TableCell>
                          <TableCell>{h.note || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={onClose} color="inherit">
            {t('common.cancel')}
          </Button>

          {order && (
            <Stack direction="row" spacing={1}>
              {/* Cancel Button */}
              {(order.status === 'AWAITING_APPROVAL' ||
                order.status === 'APPROVED' ||
                order.status === 'PREPARING') && (
                <Button
                  variant="outlined"
                  color="error"
                  disabled={transitionMutation.isPending}
                  onClick={handleOpenCancelPrompt}
                >
                  {t('orders.actions.cancelOrder')}
                </Button>
              )}

              {/* Status progression buttons */}
              {order.status === 'AWAITING_APPROVAL' && (
                <Button
                  variant="contained"
                  color="info"
                  disabled={transitionMutation.isPending}
                  onClick={handleApprove}
                >
                  {t('orders.actions.approve')}
                </Button>
              )}

              {order.status === 'APPROVED' && (
                <Button
                  variant="contained"
                  color="primary"
                  disabled={transitionMutation.isPending}
                  onClick={handleStartPreparing}
                >
                  {t('orders.actions.startPreparing')}
                </Button>
              )}

              {order.status === 'PREPARING' && (
                <Button
                  variant="contained"
                  color="primary"
                  disabled={transitionMutation.isPending}
                  onClick={handleOpenDispatchPrompt}
                >
                  {t('orders.actions.dispatch')}
                </Button>
              )}

              {order.status === 'DISPATCHED' && (
                <Button
                  variant="contained"
                  color="success"
                  disabled={transitionMutation.isPending}
                  onClick={handleMarkDelivered}
                >
                  {t('orders.actions.markDelivered')}
                </Button>
              )}
            </Stack>
          )}
        </DialogActions>
      </Dialog>

      {/* Courier Note Prompt Dialog */}
      <Dialog open={dispatchPromptOpen} onClose={() => setDispatchPromptOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('orders.dispatchPromptTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('orders.courierNotesLabel')}
            type="text"
            fullWidth
            value={courierNotes}
            onChange={(e) => setCourierNotes(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDispatchPromptOpen(false)} color="inherit">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirmDispatch} variant="contained" disabled={transitionMutation.isPending}>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Note Prompt Dialog */}
      <Dialog open={cancelPromptOpen} onClose={() => setCancelPromptOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('orders.cancelPromptTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('orders.cancelReason')}
            type="text"
            fullWidth
            value={cancelNote}
            onChange={(e) => setCancelNote(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelPromptOpen(false)} color="inherit">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirmCancel}
            variant="contained"
            color="error"
            disabled={transitionMutation.isPending}
          >
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
