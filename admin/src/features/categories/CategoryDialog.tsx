import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Switch, TextField,
} from '@mui/material'
import { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useSaveCategory } from '../../api/categories'
import { ApiError } from '../../api/client'
import type { CategoryDto } from '../../api/types'
import { ErrorAlert } from '../../components/ErrorAlert'
import { LocalizedNumberField } from '../../components/LocalizedNumberField'
import { SeoFieldsSection, type SeoFormFields } from '../../components/SeoFieldsSection'
import { applyFieldErrors } from '../../lib/forms'
import { SLUG_MAX, SLUG_PATTERN, slugify } from '../../lib/slug'
import { descendantIds } from './buildTree'

interface FormValues extends SeoFormFields {
  nameFa: string
  nameEn: string
  slug: string
  parentId: string
  sortOrder: number | null
  active: boolean
}

const FIELDS = ['nameFa', 'nameEn', 'slug', 'parentId', 'sortOrder', 'active', 'seoTitle', 'seoDescription', 'seoH1', 'seoContentFa']

interface Props {
  /** Category being edited; null creates a new one. */
  category: CategoryDto | null
  /** Parent preselected when creating. */
  defaultParentId?: number | null
  all: CategoryDto[]
  onClose: () => void
}

export function CategoryDialog({ category, defaultParentId = null, all, onClose }: Props) {
  const { t } = useTranslation()
  const save = useSaveCategory()
  const [formError, setFormError] = useState<unknown>(null)
  const slugTouched = useRef(category != null)
  const excluded = category ? descendantIds(all, category.id) : new Set<number>()

  const { register, control, handleSubmit, setError, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      nameFa: category?.nameFa ?? '',
      nameEn: category?.nameEn ?? '',
      slug: category?.slug ?? '',
      parentId: String(category ? (category.parentId ?? '') : (defaultParentId ?? '')),
      sortOrder: category?.sortOrder ?? 0,
      active: category?.active ?? true,
      seoTitle: category?.seoTitle ?? '',
      seoDescription: category?.seoDescription ?? '',
      seoH1: category?.seoH1 ?? '',
      seoContentFa: category?.seoContentFa ?? '',
    },
  })

  const maxLen = (max: number) => ({ value: max, message: t('validation.maxLength', { max }) })

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null)
    try {
      await save.mutateAsync({
        id: category?.id,
        body: {
          nameFa: v.nameFa.trim(),
          nameEn: v.nameEn.trim() || null,
          slug: v.slug,
          parentId: v.parentId ? Number(v.parentId) : null,
          sortOrder: v.sortOrder ?? 0,
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
        <DialogTitle>{category ? t('categories.edit') : t('categories.create')}</DialogTitle>
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
            <TextField
              select
              label={t('categories.parent')}
              {...register('parentId')}
              error={!!errors.parentId}
              helperText={errors.parentId?.message}
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            >
              <option value="">{t('categories.noParent')}</option>
              {all
                .filter((c) => !excluded.has(c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameFa}
                  </option>
                ))}
            </TextField>
            <LocalizedNumberField control={control} name="sortOrder" label={t('form.sortOrder')} />
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
