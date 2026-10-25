import { Button, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProduct } from '../../api/products'
import type { VariantDto } from '../../api/types'
import { formatNumber, formatToman } from '../../lib/format'
import { TierEditor } from './TierEditor'
import { VariantDialog } from './VariantDialog'

type DialogState = { mode: 'create' } | { mode: 'edit'; variant: VariantDto } | null

export function VariantsTab({ productId }: { productId: number }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en' : 'fa'
  const { data } = useProduct(productId)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [tiersFor, setTiersFor] = useState<number | null>(null)
  const variants = data?.variants ?? []
  const byId = (id: number | undefined): VariantDto | undefined => variants.find((v) => v.id === id)
  const tiering = byId(tiersFor ?? undefined)
  const flavour = (v: VariantDto) => (locale === 'en' ? v.flavourEn || v.flavourFa : v.flavourFa || v.flavourEn) ?? ''

  return (
    <Stack spacing={2}>
      <Stack direction="row">
        <Button variant="outlined" onClick={() => setDialog({ mode: 'create' })}>{t('products.variants.add')}</Button>
      </Stack>
      {variants.length === 0 ? (
        <Typography color="text.secondary">{t('common.empty')}</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('products.variants.sku')}</TableCell>
              <TableCell>{t('products.variants.flavour')}</TableCell>
              <TableCell>{t('products.variants.size')}</TableCell>
              <TableCell>{t('products.variants.price')}</TableCell>
              <TableCell>{t('products.stock')}</TableCell>
              <TableCell>{t('products.variants.activeCol')}</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {variants.map((v) => (
              <TableRow key={v.id}>
                <TableCell dir="ltr">{v.sku}</TableCell>
                <TableCell>{flavour(v)}</TableCell>
                <TableCell>{v.sizeLabel}</TableCell>
                <TableCell>{formatToman(v.basePrice, locale)}</TableCell>
                <TableCell>{formatNumber(v.stockOnHand, locale)}</TableCell>
                <TableCell>
                  <Chip size="small" color={v.active ? 'success' : 'default'} label={v.active ? t('common.active') : t('common.inactive')} />
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => setDialog({ mode: 'edit', variant: v })} aria-label={`${t('common.edit')} ${v.sku}`}>{t('common.edit')}</Button>
                  <Button size="small" onClick={() => setTiersFor(v.id)} aria-label={`${t('products.variants.tiers')} ${v.sku}`}>{t('products.variants.tiers')}</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {dialog?.mode === 'create' && <VariantDialog productId={productId} variant={null} onClose={() => setDialog(null)} />}
      {dialog?.mode === 'edit' && <VariantDialog productId={productId} variant={dialog.variant} onClose={() => setDialog(null)} />}
      {tiering && <TierEditor productId={productId} variant={tiering} onClose={() => setTiersFor(null)} />}
    </Stack>
  )
}
