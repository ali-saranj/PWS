import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/client'
import type { VariantDto } from '../../api/types'
import { useSaveTiers } from '../../api/variants'
import { ErrorAlert } from '../../components/ErrorAlert'
import { LocalizedNumberField } from '../../components/LocalizedNumberField'
import { formatNumber, rialsToToman, tomanToRials } from '../../lib/format'
import { unitTomanFor, validateTiers, type TierRow } from './tierRules'

interface Row {
  minQty: number | null
  unitToman: number | null
}
interface FormValues {
  tiers: Row[]
}

const EXAMPLE_QTY = 10
const SERVER_FIELD = /^tiers\[(\d+)\]\.(minQty|unitPrice)$/

interface Props {
  productId: number
  variant: VariantDto
  onClose: () => void
}

export function TierEditor({ productId, variant, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const save = useSaveTiers(productId)
  const [formError, setFormError] = useState<unknown>(null)
  const baseToman = rialsToToman(variant.basePrice)
  const locale = i18n.language === 'en' ? 'en' : 'fa'

  const { control, handleSubmit, setError, clearErrors } = useForm<FormValues>({
    defaultValues: {
      tiers: variant.tiers.map((x) => ({ minQty: x.minQty, unitToman: rialsToToman(x.unitPrice) })),
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'tiers' })
  const watched = useWatch({ control, name: 'tiers' })

  const complete = (watched ?? []).filter((r): r is TierRow => r.minQty != null && r.unitToman != null)
  const example = unitTomanFor(baseToman, complete, EXAMPLE_QTY)

  const onSubmit = handleSubmit(async ({ tiers }) => {
    setFormError(null)
    clearErrors()
    let bad = false
    tiers.forEach((r, i) => {
      if (r.minQty == null) {
        setError(`tiers.${i}.minQty`, { type: 'validate', message: t('validation.required') })
        bad = true
      }
      if (r.unitToman == null) {
        setError(`tiers.${i}.unitToman`, { type: 'validate', message: t('validation.required') })
        bad = true
      }
    })
    if (bad) return
    const rows = tiers as TierRow[]
    const ruleErrors = validateTiers(baseToman, rows)
    for (const e of ruleErrors) {
      setError(`tiers.${e.index}.${e.field === 'unitPrice' ? 'unitToman' : 'minQty'}`, { type: 'validate', message: t(e.messageKey) })
    }
    if (ruleErrors.length > 0) return
    try {
      await save.mutateAsync({
        id: variant.id,
        tiers: rows.map((r) => ({ minQty: r.minQty, unitPrice: tomanToRials(r.unitToman) })),
      })
      onClose()
    } catch (e) {
      if (!(e instanceof ApiError)) return setFormError(e)
      let handled = 0
      for (const fe of e.fieldErrors) {
        const m = SERVER_FIELD.exec(fe.field)
        if (m) {
          const name = `tiers.${Number(m[1])}.${m[2] === 'unitPrice' ? 'unitToman' : 'minQty'}` as const
          setError(name, { type: 'server', message: t(`products.tiers.errors.${m[2]}`) })
          handled++
        }
      }
      setFormError(handled > 0 && handled === e.fieldErrors.length ? null : e)
    }
  })

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>{t('products.tiers.title', { sku: variant.sku })}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary">
              {t('products.tiers.base', { price: formatNumber(baseToman, locale) })}
            </Typography>
            <ErrorAlert error={formError} />
            {fields.length === 0 && <Typography color="text.secondary">{t('products.tiers.none')}</Typography>}
            {fields.map((f, i) => (
              <Stack key={f.id} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                <LocalizedNumberField
                  control={control}
                  name={`tiers.${i}.minQty`}
                  label={`${t('products.tiers.minQty')} ${i + 1}`}
                />
                <LocalizedNumberField
                  control={control}
                  name={`tiers.${i}.unitToman`}
                  label={`${t('products.tiers.unitPrice')} ${i + 1}`}
                />
                <IconButton aria-label={`${t('common.delete')} ${i + 1}`} onClick={() => remove(i)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            ))}
            <Stack direction="row">
              <Button onClick={() => append({ minQty: null, unitToman: null })}>{t('products.tiers.add')}</Button>
            </Stack>
            <Typography data-testid="tier-example">
              {t('products.tiers.example', { qty: formatNumber(EXAMPLE_QTY, locale), price: formatNumber(example, locale) })}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={save.isPending}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={save.isPending}>{t('common.save')}</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
