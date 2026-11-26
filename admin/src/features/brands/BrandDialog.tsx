import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Switch, TextField } from '@mui/material'
import { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useSaveBrand } from '../../api/brands'
import { ApiError } from '../../api/client'
import type { BrandDto } from '../../api/types'
import { ErrorAlert } from '../../components/ErrorAlert'
import { SeoFieldsSection, type SeoFormFields } from '../../components/SeoFieldsSection'
import { applyFieldErrors } from '../../lib/forms'
import { SLUG_MAX, SLUG_PATTERN, slugify } from '../../lib/slug'

interface FormValues extends SeoFormFields {
  nameFa: string
  nameEn: string
  slug: string
  active: boolean
}

const FIELDS = ['nameFa', 'nameEn', 'slug', 'active', 'seoTitle', 'seoDescription', 'seoH1', 'seoContentFa']

/** brand is null when creating. */
export function BrandDialog({ brand, onClose }: { brand: BrandDto | null; onClose: () => void }) {
  const { t } = useTranslation()
  const save = useSaveBrand()
  const [formError, setFormError] = useState<unknown>(null)
  const slugTouched = useRef(brand != null)

  const { register, control, handleSubmit, setError, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      nameFa: brand?.nameFa ?? '',
      nameEn: brand?.nameEn ?? '',
      slug: brand?.slug ?? '',
      active: brand?.active ?? true,
      seoTitle: brand?.seoTitle ?? '',
      seoDescription: brand?.seoDescription ?? '',
      seoH1: brand?.seoH1 ?? '',
      seoContentFa: brand?.seoContentFa ?? '',
    },
  })

  const maxLen = (max: number) => ({ value: max, message: t('validation.maxLength', { max }) })

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null)
    try {
      await save.mutateAsync({
        id: brand?.id,
        body: {
          nameFa: v.nameFa.trim(),
          nameEn: v.nameEn.trim() || null,
          slug: v.slug,
          active: v.active,
          seoTitle: v.seoTitle.trim() || null,
          seoDescription: v.seoDescription.trim() || null,
          seoH1: v.seoH1.trim() || null,
          seoContentFa: v.seoContentFa.trim() || null,
        },
      })
      onClose()
    } catch (e) {
      setFormError(e instanceof ApiError ? applyFieldErrors(e, setError, FIELDS) : e)
    }
  })

  const nameEn = register('nameEn', { maxLength: maxLen(200) })

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>{brand ? t('brands.edit') : t('brands.create')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <ErrorAlert error={formError} />
            <TextField
              label={t('form.nameFa')}
              {...register('nameFa', {
                validate: (s) => s.trim() !== '' || t('validation.required'),
                maxLength: maxLen(200),
              })}
              error={!!errors.nameFa}
              helperText={errors.nameFa?.message}
              autoFocus
            />
            <TextField
              label={t('form.nameEn')}
              {...nameEn}
              onChange={(e) => {
                void nameEn.onChange(e)
                if (!slugTouched.current) setValue('slug', slugify(e.target.value), { shouldValidate: false })
              }}
              error={!!errors.nameEn}
              helperText={errors.nameEn?.message}
              slotProps={{ htmlInput: { dir: 'ltr' } }}
            />
            <TextField
              label={t('form.slug')}
              {...register('slug', {
                required: t('validation.required'),
                maxLength: maxLen(SLUG_MAX),
                pattern: { value: SLUG_PATTERN, message: t('validation.slug') },
                onChange: () => {
                  slugTouched.current = true
                },
              })}
              error={!!errors.slug}
              helperText={errors.slug?.message}
              slotProps={{ htmlInput: { dir: 'ltr' } }}
            />
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label={t('form.active')}
                />
              )}
            />
            <SeoFieldsSection register={register} errors={errors} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={save.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={save.isPending}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
