import { Accordion, AccordionDetails, AccordionSummary, Stack, TextField, Typography } from '@mui/material'
import type { FieldErrors, Path, UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

export interface SeoFormFields {
  seoTitle: string
  seoDescription: string
  seoH1: string
  seoContentFa: string
}

interface Props<T extends SeoFormFields> {
  register: UseFormRegister<T>
  errors: FieldErrors<T>
}

/** Collapsible optional SEO metadata fields shared by Category and Brand dialogs. */
export function SeoFieldsSection<T extends SeoFormFields>({ register, errors }: Props<T>) {
  const { t } = useTranslation()
  const maxLen = (max: number) => ({ value: max, message: t('validation.maxLength', { max }) })

  return (
    <Accordion disableGutters variant="outlined" sx={{ borderRadius: 1, '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<span aria-hidden="true">▾</span>}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {t('form.seoSection')}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <TextField
            label={t('form.seoTitle')}
            {...register('seoTitle' as Path<T>, { maxLength: maxLen(160) })}
            error={!!errors.seoTitle}
            helperText={errors.seoTitle?.message as string | undefined}
          />
          <TextField
            label={t('form.seoDescription')}
            multiline
            minRows={2}
            {...register('seoDescription' as Path<T>, { maxLength: maxLen(320) })}
            error={!!errors.seoDescription}
            helperText={errors.seoDescription?.message as string | undefined}
          />
          <TextField
            label={t('form.seoH1')}
            {...register('seoH1' as Path<T>, { maxLength: maxLen(200) })}
            error={!!errors.seoH1}
            helperText={errors.seoH1?.message as string | undefined}
          />
          <TextField
            label={t('form.seoContentFa')}
            multiline
            minRows={3}
            {...register('seoContentFa' as Path<T>, { maxLength: maxLen(4000) })}
            error={!!errors.seoContentFa}
            helperText={errors.seoContentFa?.message as string | undefined}
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}
