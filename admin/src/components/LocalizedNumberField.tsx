import { TextField, type TextFieldProps } from '@mui/material'
import { useState } from 'react'
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { parseLocalizedInt, toLatinDigits } from '../lib/format'

type Props<T extends FieldValues> = Omit<TextFieldProps, 'name' | 'value' | 'onChange' | 'defaultValue'> & {
  control: Control<T>
  name: FieldPath<T>
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

function localizeDigits(s: string, locale: string): string {
  const latin = toLatinDigits(s)
  return locale === 'fa' ? latin.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]) : latin
}

/** Text field that shows digits in the current locale, accepts either digit set, and emits number | null. */
export function LocalizedNumberField<T extends FieldValues>({ control, name, helperText, ...rest }: Props<T>) {
  const { t, i18n } = useTranslation()
  const { field, fieldState } = useController({ control, name })
  const value = field.value as number | null | undefined
  const [raw, setRaw] = useState(value == null ? '' : String(value))

  // Keep the text in sync when the form value is changed from outside (reset/setValue).
  const rawValue = parseLocalizedInt(raw)
  if ((value ?? null) !== rawValue && !(rawValue === null && raw !== '' && value == null)) {
    setRaw(value == null ? '' : String(value))
  }

  const invalid = raw.trim() !== '' && rawValue === null
  const message = invalid ? t('validation.integer') : (fieldState.error?.message ?? helperText)

  return (
    <TextField
      {...rest}
      name={field.name}
      inputRef={field.ref}
      value={localizeDigits(raw, i18n.language)}
      onBlur={field.onBlur}
      onChange={(e) => {
        const text = e.target.value
        setRaw(text)
        field.onChange(parseLocalizedInt(text))
      }}
      error={invalid || !!fieldState.error}
      helperText={message}
      slotProps={{ htmlInput: { inputMode: 'numeric' } }}
    />
  )
}
