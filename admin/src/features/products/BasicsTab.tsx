import { FormControlLabel, MenuItem, Stack, Switch, TextField } from '@mui/material'
import { useMemo, type RefObject } from 'react'
import { Controller, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useBrands } from '../../api/brands'
import { useCategories } from '../../api/categories'
import { RichTextEditor } from '../../components/RichTextEditor'
import { SLUG_MAX, SLUG_PATTERN, slugify } from '../../lib/slug'
import { buildTree, flattenTree } from '../categories/buildTree'
import { NAME_MAX, type ProductFormValues } from './productSchema'

interface Props {
  control: Control<ProductFormValues>
  register: UseFormRegister<ProductFormValues>
  setValue: UseFormSetValue<ProductFormValues>
  errors: FieldErrors<ProductFormValues>
  slugTouched: RefObject<boolean>
}

export function BasicsTab({ control, register, setValue, errors, slugTouched }: Props) {
  const { t, i18n } = useTranslation()
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const flat = useMemo(() => flattenTree(buildTree(categories ?? [])), [categories])
  const fa = i18n.language !== 'en'
  const maxLen = (max: number) => ({ value: max, message: t('validation.maxLength', { max }) })
  const nameEn = register('nameEn', { maxLength: maxLen(NAME_MAX) })

  return (
    <Stack spacing={2}>
      <TextField
        label={t('form.nameFa')}
        {...register('nameFa', { validate: (s) => s.trim() !== '' || t('validation.required'), maxLength: maxLen(NAME_MAX) })}
        error={!!errors.nameFa}
        helperText={errors.nameFa?.message}
      />
      <TextField
        label={t('form.nameEn')}
        {...nameEn}
        onChange={(e) => {
          void nameEn.onChange(e)
          if (!slugTouched.current) setValue('slug', slugify(e.target.value), { shouldValidate: false, shouldDirty: true })
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
        name="categoryId"
        rules={{ validate: (v) => v !== '' || t('validation.required') }}
        render={({ field, fieldState }) => (
          <TextField
            select
            label={t('products.category')}
            value={categories ? field.value : ''}
            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
            inputRef={field.ref}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          >
            {flat.map(({ node, depth }) => (
              <MenuItem key={node.id} value={node.id} sx={{ paddingInlineStart: `${16 + depth * 20}px` }}>
                {fa ? node.nameFa : node.nameEn || node.nameFa}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        control={control}
        name="brandId"
        rules={{ validate: (v) => v !== '' || t('validation.required') }}
        render={({ field, fieldState }) => (
          <TextField
            select
            label={t('products.brand')}
            value={brands ? field.value : ''}
            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
            inputRef={field.ref}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          >
            {(brands ?? []).map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {fa ? b.nameFa : b.nameEn || b.nameFa}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        control={control}
        name="featured"
        render={({ field }) => (
          <FormControlLabel
            control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
            label={t('products.featured')}
          />
        )}
      />
      <Controller
        control={control}
        name="descriptionFa"
        render={({ field, fieldState }) => (
          <RichTextEditor label={t('products.descriptionFa')} value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
        )}
      />
      <Controller
        control={control}
        name="descriptionEn"
        render={({ field, fieldState }) => (
          <RichTextEditor label={t('products.descriptionEn')} value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
        )}
      />
    </Stack>
  )
}
