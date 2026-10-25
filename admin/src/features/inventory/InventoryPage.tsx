import HistoryIcon from '@mui/icons-material/History'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, FormControlLabel, IconButton, Paper, Stack, Switch, Table,
  TableBody, TableCell, TableHead, TablePagination, TableRow, TextField, Typography,
} from '@mui/material'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useAdjustStock, useInventory } from '../../api/inventory'
import { ApiError } from '../../api/client'
import type { AdjustmentItem, InventoryRowDto } from '../../api/types'
import { ErrorAlert } from '../../components/ErrorAlert'
import { localizeDigits, parseLocalizedSignedInt } from '../../lib/format'
import { MovementsDrawer } from './MovementsDrawer'

const SIZES = [20, 50, 100]
const DELTA_ERROR = /^adjustments\[(\d+)\]\.(delta|variantId)$/

function num(v: string | null): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export default function InventoryPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en' : 'fa'
  const [params, setParams] = useSearchParams()
  const filters = {
    q: params.get('q') || undefined,
    lowStock: params.get('lowStock') === 'true',
    page: Math.max(0, num(params.get('page')) ?? 0),
    size: SIZES.find((s) => s === num(params.get('size'))) ?? 20,
  }
  const { data, isLoading, error } = useInventory(filters)
  const adjust = useAdjustStock()

  // Pending deltas (raw text, keyed by variantId) survive paging and filter changes.
  const [pending, setPending] = useState<Record<number, string>>({})
  const [skus, setSkus] = useState<Record<number, string>>({})
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({})
  const [generalError, setGeneralError] = useState<unknown>(null)
  const [note, setNote] = useState('')
  const [historyRow, setHistoryRow] = useState<InventoryRowDto | null>(null)

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

  const [search, setSearch] = useState(filters.q ?? '')
  useEffect(() => {
    if (search === (filters.q ?? '')) return
    const timer = setTimeout(() => patch({ q: search.trim() }), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const setDelta = (variantId: number, sku: string, text: string) => {
    setSkus((m) => ({ ...m, [variantId]: sku }))
    setPending((p) => {
      const next = { ...p }
      if (text === '') delete next[variantId]
      else next[variantId] = text
      return next
    })
    setRowErrors((e) => {
      if (!(variantId in e)) return e
      const next = { ...e }
      delete next[variantId]
      return next
    })
  }

  const entries = Object.entries(pending).map(([id, text]) => ({ variantId: Number(id), text, delta: parseLocalizedSignedInt(text) }))
  const changes = entries.filter((e) => e.delta !== null && e.delta !== 0)
  const hasInvalid = entries.some((e) => e.delta === null)

  const discard = () => {
    setPending({})
    setRowErrors({})
    setGeneralError(null)
    setNote('')
  }

  const shownIds = new Set((data?.items ?? []).map((r) => r.variantId))
  const offPageErrors = Object.entries(rowErrors).filter(([id]) => !shownIds.has(Number(id)))

  const apply = () => {
    const trimmed = note.trim()
    const adjustments: AdjustmentItem[] = changes.map((c) => ({
      variantId: c.variantId,
      delta: c.delta as number,
      ...(trimmed ? { note: trimmed } : {}),
    }))
    setRowErrors({})
    setGeneralError(null)
    adjust.mutate(
      { adjustments },
      {
        onSuccess: () => {
          setPending({})
          setNote('')
        },
        onError: (err) => {
          const errs: Record<number, string> = {}
          let unmapped = !(err instanceof ApiError) || err.fieldErrors.length === 0
          if (err instanceof ApiError) {
            for (const fe of err.fieldErrors) {
              const m = DELTA_ERROR.exec(fe.field)
              const target = m ? adjustments[Number(m[1])] : undefined
              if (target) errs[target.variantId] ??= fe.message
              else unmapped = true
            }
          }
          setRowErrors(errs)
          setGeneralError(unmapped ? err : null)
        },
      },
    )
  }

  const productName = (r: InventoryRowDto) => (locale === 'fa' ? r.productNameFa : r.productNameEn || r.productNameFa)
  const variantLabel = (r: InventoryRowDto) =>
    [locale === 'fa' ? r.flavourFa : r.flavourEn || r.flavourFa, r.sizeLabel].filter(Boolean).join(' · ')

  return (
    <Fragment>
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 2 }}>{t('inventory.title')}</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2, alignItems: { md: 'center' } }}>
          <TextField size="small" label={t('inventory.search')} value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1 }} />
          <FormControlLabel
            control={<Switch checked={filters.lowStock} onChange={(e) => patch({ lowStock: e.target.checked ? 'true' : undefined })} />}
            label={t('inventory.lowStockOnly')}
          />
        </Stack>
        <ErrorAlert error={error} />
        <ErrorAlert error={generalError} />
        {offPageErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {offPageErrors.map(([id, message]) => (
              <div key={id}>{`${skus[Number(id)] ?? id}: ${message}`}</div>
            ))}
          </Alert>
        )}
        {isLoading && <CircularProgress aria-label={t('common.loading')} />}
        {data && data.items.length === 0 && <Typography color="text.secondary">{t('common.empty')}</Typography>}
        {data && data.items.length > 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('inventory.product')}</TableCell>
                  <TableCell>{t('inventory.sku')}</TableCell>
                  <TableCell>{t('inventory.stock')}</TableCell>
                  <TableCell>{t('inventory.threshold')}</TableCell>
                  <TableCell>{t('inventory.adjustBy')}</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((r) => {
                  const text = pending[r.variantId] ?? ''
                  const invalidText = text !== '' && parseLocalizedSignedInt(text) === null
                  const serverError = rowErrors[r.variantId]
                  const low = r.stockOnHand <= r.lowStockThreshold
                  return (
                    <TableRow
                      key={r.variantId}
                      data-testid={`inventory-row-${r.variantId}`}
                      data-low-stock={low}
                      sx={{
                        bgcolor: serverError ? 'error.light' : low ? 'warning.light' : undefined,
                        opacity: r.active ? 1 : 0.6,
                      }}
                    >
                      <TableCell>
                        <div>{productName(r)}</div>
                        <Typography variant="caption" color="text.secondary">{variantLabel(r)}</Typography>
                      </TableCell>
                      <TableCell>{r.sku}</TableCell>
                      <TableCell>{localizeDigits(String(r.stockOnHand), locale)}</TableCell>
                      <TableCell>{localizeDigits(String(r.lowStockThreshold), locale)}</TableCell>
                      <TableCell sx={{ minWidth: 140 }}>
                        <TextField
                          size="small"
                          value={localizeDigits(text, locale)}
                          onChange={(e) => setDelta(r.variantId, r.sku, e.target.value.trim())}
                          error={invalidText || !!serverError}
                          helperText={serverError ?? (invalidText ? t('validation.integer') : undefined)}
                          slotProps={{
                            htmlInput: { 'aria-label': t('inventory.adjustAria', { sku: r.sku }), inputMode: 'text', dir: 'ltr' },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton aria-label={t('inventory.historyAria', { sku: r.sku })} onClick={() => setHistoryRow(r)}>
                          <HistoryIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
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
      {entries.length > 0 && (
        <Paper elevation={6} data-testid="apply-bar" sx={{ position: 'sticky', bottom: 0, p: 2, zIndex: 1 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
            <TextField
              size="small"
              label={t('inventory.noteAll')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 500 } }}
              sx={{ flex: 1 }}
            />
            <Button onClick={discard} disabled={adjust.isPending}>{t('inventory.discard')}</Button>
            <Button
              variant="contained"
              onClick={apply}
              disabled={adjust.isPending || hasInvalid || changes.length === 0}
            >
              {t('inventory.apply', { count: changes.length, n: localizeDigits(String(changes.length), locale) })}
            </Button>
          </Stack>
        </Paper>
      )}
      <MovementsDrawer
        variantId={historyRow?.variantId ?? null}
        title={historyRow ? `${productName(historyRow)} — ${historyRow.sku}` : ''}
        onClose={() => setHistoryRow(null)}
      />
    </Fragment>
  )
}
