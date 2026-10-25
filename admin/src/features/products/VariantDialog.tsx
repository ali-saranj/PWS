import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Switch, TextField } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/client'
import type { FieldError, VariantDto, VariantUpsertRequest } from '../../api/types'
import { useCreateVariant, useUpdateVariant } from '../../api/variants'
import { ErrorAlert } from '../../components/ErrorAlert'
import { LocalizedNumberField } from '../../components/LocalizedNumberField'
import { applyFieldErrors } from '../../lib/forms'
import { rialsToToman, tomanToRials } from '../../lib/format'

interface FormValues {
  sku: string
  flavourFa: string
  flavourEn: string
  sizeLabel: string
  weightGrams: number | null
  basePriceToman: number | null
  compareAtToman: number | null
  lowStockThreshold: number | null
  initialStock: number | null
  active: boolean
}

const FIELDS = ['sku', 'flavourFa', 'flavourEn', 'sizeLabel', 'weightGrams', 'basePriceToman', 'compareAtToman', 'lowStockThreshold', 'initialStock']
const SERVER_TO_FORM: Record<string, string> = { basePrice: 'basePriceToman', compareAtPrice: 'compareAtToman' }

interface Props {
  productId: number
  /** null when creating. */
  variant: VariantDto | null
  onClose: () => void
}

export function VariantDialog({ productId, variant, onClose }: Props) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const create = useCreateVariant(productId)
  const update = useUpdateVariant(productId)
  const [formError, setFormError] = useState<unknown>(null)
  const [conflict, setConflict] = useState(false)

  const { register, control, handleSubmit, setError, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      sku: variant?.sku ?? '',
      flavourFa: variant?.flavourFa ?? '',
      flavourEn: variant?.flavourEn ?? '',
      sizeLabel: variant?.sizeLabel ?? '',
      weightGrams: variant?.weightGrams ?? null,
      basePriceToman: variant ? rialsToToman(variant.basePrice) : null,
      compareAtToman: variant?.compareAtPrice != null ? rialsToToman(variant.compareAtPrice) : null,
      lowStockThreshold: variant?.lowStockThreshold ?? null,
      initialStock: null,
      active: variant?.active ?? true,
    },
  })

  const maxLen = (max: number) => ({ value: max, message: t('validation.maxLength', { max }) })

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null)
    let bad = false
    if (v.sku.trim() === '') {
      setError('sku', { type: 'validate', message: t('validation.required') })
      bad = true
    }
    if (v.basePriceToman == null || v.basePriceToman <= 0) {
      setError('basePriceToman', { type: 'validate', message: t('validation.required') })
      bad = true
    } else if (v.compareAtToman != null && v.compareAtToman <= v.basePriceToman) {
      setError('compareAtToman', { type: 'validate', message: t('products.variants.compareAtInvalid') })
      bad = true
    }
    if (bad || v.basePriceToman == null) return

    const body: VariantUpsertRequest = {
      sku: v.sku.trim(),
      flavourFa: v.flavourFa.trim() || null,
      flavourEn: v.flavourEn.trim() || null,
      sizeLabel: v.sizeLabel.trim() || null,
      weightGrams: v.weightGrams,
      basePrice: tomanToRials(v.basePriceToman),
      compareAtPrice: v.compareAtToman != null ? tomanToRials(v.compareAtToman) : null,
      lowStockThreshold: v.lowStockThreshold,
      active: v.active,
      sortOrder: variant?.sortOrder ?? null,
    }
    try {
      if (variant) await update.mutateAsync({ id: variant.id, body: { ...body, version: variant.version } })
      else await create.mutateAsync({ ...body, initialStock: v.initialStock ?? 0 })
      onClose()
    } catch (e) {
      if (!(e instanceof ApiError)) return setFormError(e)
      if (e.code === 'CONFLICT') {
        setConflict(true)
        return setFormError(e)
      }
      const mapped: FieldError[] = e.fieldErrors.map((fe) => ({
        ...fe,
        field: SERVER_TO_FORM[fe.field] ?? fe.field,
        message:
          fe.field === 'basePrice' && fe.code === 'TIER_INVALID' ? t('products.variants.baseTierInvalid') : fe.message,
      }))
      const clone = new ApiError(e.status, e.code, e.messages, mapped, e.requestId)
      setFormError(applyFieldErrors(clone, setError, FIELDS))
    }
  })

  const reload = async () => {
    await qc.invalidateQueries({ queryKey: ['product', productId] })
    onClose()
  }

  const pending = create.isPending || update.isPending
  const err = (name: keyof FormValues) => ({ error: !!errors[name], helperText: errors[name]?.message })

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>{variant ? t('products.variants.edit') : t('products.variants.create')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <ErrorAlert error={formError} />
            {conflict && (
              <Button onClick={() => void reload()}>{t('products.reload')}</Button>
            )}
            <TextField label={t('products.variants.sku')} {...register('sku', { maxLength: maxLen(64) })} {...err('sku')} slotProps={{ htmlInput: { dir: 'ltr' } }} />
            <TextField label={t('products.variants.flavourFa')} {...register('flavourFa', { maxLength: maxLen(100) })} {...err('flavourFa')} />
            <TextField label={t('products.variants.flavourEn')} {...register('flavourEn', { maxLength: maxLen(100) })} {...err('flavourEn')} slotProps={{ htmlInput: { dir: 'ltr' } }} />
            <TextField label={t('products.variants.size')} {...register('sizeLabel', { maxLength: maxLen(50) })} {...err('sizeLabel')} />
            <LocalizedNumberField control={control} name="weightGrams" label={t('products.variants.weight')} />
            <LocalizedNumberField control={control} name="basePriceToman" label={t('products.variants.basePrice')} />
            <LocalizedNumberField control={control} name="compareAtToman" label={t('products.variants.compareAt')} />
            <LocalizedNumberField control={control} name="lowStockThreshold" label={t('products.variants.lowStock')} />
            {!variant && <LocalizedNumberField control={control} name="initialStock" label={t('products.variants.initialStock')} />}
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label={t('common.active')}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={pending}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={pending}>{t('common.save')}</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
