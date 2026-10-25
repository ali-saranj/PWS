import AddIcon from '@mui/icons-material/Add'
import {
  Avatar, Box, Button, Card, CardContent, CircularProgress, MenuItem, Stack, Table, TableBody, TableCell,
  TableHead, TablePagination, TableRow, TextField, Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useSearchParams } from 'react-router'
import { useBrands } from '../../api/brands'
import { useCategories } from '../../api/categories'
import { useProducts, type ProductFilters } from '../../api/products'
import type { ProductStatus } from '../../api/types'
import { ErrorAlert } from '../../components/ErrorAlert'
import { formatToman } from '../../lib/format'
import { buildTree, flattenTree } from '../categories/buildTree'
import { StatusChip } from './StatusChip'

const STATUSES: ProductStatus[] = ['DRAFT', 'ACTIVE', 'ARCHIVED']
const SIZES = [20, 50, 100]

function num(v: string | null): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export default function ProductListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en' : 'fa'
  const [params, setParams] = useSearchParams()
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()

  const status = STATUSES.find((s) => s === params.get('status'))
  const size = SIZES.find((s) => s === num(params.get('size'))) ?? 20
  const filters: ProductFilters = {
    q: params.get('q') || undefined,
    status,
    categoryId: num(params.get('categoryId')),
    brandId: num(params.get('brandId')),
    page: Math.max(0, num(params.get('page')) ?? 0),
    size,
  }
  const { data, isLoading, error } = useProducts(filters)

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

  const flat = useMemo(() => flattenTree(buildTree(categories ?? [])), [categories])
  const name = (fa: string, en: string | null) => (locale === 'fa' ? fa : en || fa)
  const categoryName = (id: number) => {
    const c = categories?.find((x) => x.id === id)
    return c ? name(c.nameFa, c.nameEn) : '—'
  }
  const brandName = (id: number) => {
    const b = brands?.find((x) => x.id === id)
    return b ? name(b.nameFa, b.nameEn) : '—'
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">{t('products.title')}</Typography>
          <Button component={RouterLink} to="/products/new" variant="contained" startIcon={<AddIcon />}>
            {t('products.add')}
          </Button>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField size="small" label={t('products.search')} value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1 }} />
          <TextField select size="small" label={t('products.statusLabel')} value={status ?? ''} onChange={(e) => patch({ status: e.target.value })} sx={{ minWidth: 150 }}>
            <MenuItem value="">{t('products.all')}</MenuItem>
            {STATUSES.map((s) => (
              <MenuItem key={s} value={s}>{t(`products.status.${s}`)}</MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label={t('products.category')} value={categories ? (filters.categoryId ?? '') : ''} onChange={(e) => patch({ categoryId: e.target.value })} sx={{ minWidth: 180 }}>
            <MenuItem value="">{t('products.all')}</MenuItem>
            {flat.map(({ node, depth }) => (
              <MenuItem key={node.id} value={node.id} sx={{ paddingInlineStart: `${16 + depth * 20}px` }}>
                {name(node.nameFa, node.nameEn)}
              </MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label={t('products.brand')} value={brands ? (filters.brandId ?? '') : ''} onChange={(e) => patch({ brandId: e.target.value })} sx={{ minWidth: 150 }}>
            <MenuItem value="">{t('products.all')}</MenuItem>
            {(brands ?? []).map((b) => (
              <MenuItem key={b.id} value={b.id}>{name(b.nameFa, b.nameEn)}</MenuItem>
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
                  <TableCell>{t('products.name')}</TableCell>
                  <TableCell>{t('products.brand')}</TableCell>
                  <TableCell>{t('products.category')}</TableCell>
                  <TableCell>{t('products.statusLabel')}</TableCell>
                  <TableCell>{t('products.minPrice')}</TableCell>
                  <TableCell>{t('products.stock')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      {p.thumbnailUrl ? <Avatar variant="rounded" src={p.thumbnailUrl} alt="" /> : <Avatar variant="rounded">{(p.nameEn || p.nameFa).charAt(0)}</Avatar>}
                    </TableCell>
                    <TableCell>
                      <RouterLink to={`/products/${p.id}`}>{name(p.nameFa, p.nameEn)}</RouterLink>
                    </TableCell>
                    <TableCell>{brandName(p.brandId)}</TableCell>
                    <TableCell>{categoryName(p.categoryId)}</TableCell>
                    <TableCell><StatusChip status={p.status} /></TableCell>
                    <TableCell>{p.minPrice == null ? '—' : formatToman(p.minPrice, locale)}</TableCell>
                    <TableCell>{p.totalStock}</TableCell>
                  </TableRow>
                ))}
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
