import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import '../i18n'
import { LocalizedNumberField } from './LocalizedNumberField'

function Harness({ onValue }: { onValue: (v: number | null) => void }) {
  const { control, watch } = useForm<{ price: number | null }>({ defaultValues: { price: null } })
  onValue(watch('price'))
  return <LocalizedNumberField control={control} name="price" label="Price" />
}

describe('LocalizedNumberField', () => {
  it('emits a number when typing Persian digits', async () => {
    const onValue = vi.fn()
    render(<Harness onValue={onValue} />)
    await userEvent.type(screen.getByLabelText('Price'), '۱۲۰۰')
    expect(onValue).toHaveBeenLastCalledWith(1200)
  })

  it('shows a validation message and emits null for junk', async () => {
    const onValue = vi.fn()
    render(<Harness onValue={onValue} />)
    await userEvent.type(screen.getByLabelText('Price'), 'abc')
    expect(onValue).toHaveBeenLastCalledWith(null)
    expect(screen.getByText(/عدد|number/i)).toBeInTheDocument()
  })
})
