import { Stack, TextField } from '@mui/material'
import { useWatch, type Control, type UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../lib/format'
import { SEO_DESCRIPTION_MAX, SEO_TITLE_MAX, type ProductFormValues } from './productSchema'

type SeoField = 'seoTitleFa' | 'seoTitleEn' | 'seoDescriptionFa' | 'seoDescriptionEn'

interface Props {
  control: Control<ProductFormValues>
  register: UseFormRegister<ProductFormValues>
  errors: Partial<Record<SeoField, { message?: string }>>
}

function SeoField({
  name, label, max, multiline, ltr, control, register, errorMessage,
}: {
  name: SeoField
  label: string
  max: number
  multiline?: boolean
  ltr?: boolean
  control: Control<ProductFormValues>
  register: UseFormRegister<ProductFormValues>
  errorMessage?: string
}) {
  const { t, i18n } = useTranslation()
  const length = useWatch({ control, name }).length
  const over = length > max
  const locale = i18n.language === 'en' ? 'en' : 'fa'
  const counter = `${formatNumber(length, locale)}/${formatNumber(max, locale)}`
  return (
    <TextField
      label={label}
      multiline={multiline}
      minRows={multiline ? 3 : undefined}
      {...register(name, { maxLength: { value: max, message: t('validation.maxLength', { max }) } })}
      error={over || !!errorMessage}
      color={over ? 'warning' : undefined}
      helperText={
        <>
          <span data-testid={`${name}-counter`}>{counter}</span>
          {over ? ` — ${t('products.seo.tooLong')}` : ''}
          {errorMessage && !over ? ` — ${errorMessage}` : ''}
        </>
      }
      slotProps={{ htmlInput: ltr ? { dir: 'ltr' } : { dir: 'auto' } }}
    />
  )
}

export function SeoTab({ control, register, errors }: Props) {
  const { t } = useTranslation()
  const common = { control, register }
  return (
    <Stack spacing={2}>
      <SeoField name="seoTitleFa" label={t('products.seo.titleFa')} max={SEO_TITLE_MAX} errorMessage={errors.seoTitleFa?.message} {...common} />
      <SeoField name="seoDescriptionFa" label={t('products.seo.descriptionFa')} max={SEO_DESCRIPTION_MAX} multiline errorMessage={errors.seoDescriptionFa?.message} {...common} />
      <SeoField name="seoTitleEn" label={t('products.seo.titleEn')} max={SEO_TITLE_MAX} ltr errorMessage={errors.seoTitleEn?.message} {...common} />
      <SeoField name="seoDescriptionEn" label={t('products.seo.descriptionEn')} max={SEO_DESCRIPTION_MAX} multiline ltr errorMessage={errors.seoDescriptionEn?.message} {...common} />
    </Stack>
  )
}
