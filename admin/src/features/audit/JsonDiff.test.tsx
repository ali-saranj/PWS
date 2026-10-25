import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '../../i18n'
import { JsonDiff } from './JsonDiff'

describe('JsonDiff', () => {
  it('lists only changed keys', () => {
    render(<JsonDiff before={{ a: 1, b: 'same', c: { x: 1 } }} after={{ a: 2, b: 'same', c: { x: 1 } }} />)
    expect(screen.getByTestId('diff-a')).toBeInTheDocument()
    expect(screen.queryByTestId('diff-b')).not.toBeInTheDocument()
    expect(screen.queryByTestId('diff-c')).not.toBeInTheDocument()
    expect(within(screen.getByTestId('diff-a')).getByText('1')).toBeInTheDocument()
    expect(within(screen.getByTestId('diff-a')).getByText('2')).toBeInTheDocument()
  })

  it('shows every key as added when before is null and removed when after is null', () => {
    const { unmount } = render(<JsonDiff before={null} after={{ a: 1, b: { x: [1] } }} />)
    expect(screen.getByTestId('diff-a')).toHaveAttribute('data-kind', 'added')
    expect(screen.getByTestId('diff-b')).toHaveAttribute('data-kind', 'added')
    expect(screen.getByText('{"x":[1]}')).toBeInTheDocument()
    unmount()
    render(<JsonDiff before={{ a: 1 }} after={null} />)
    expect(screen.getByTestId('diff-a')).toHaveAttribute('data-kind', 'removed')
  })

  it('compares nested objects deeply and never renders values as HTML', () => {
    render(<JsonDiff before={{ n: { x: 1, y: [1, 2] }, h: '<b>hi</b>' }} after={{ n: { x: 1, y: [1, 3] }, h: '<b>hi</b>' }} />)
    expect(screen.getByTestId('diff-n')).toHaveAttribute('data-kind', 'changed')
    expect(screen.queryByTestId('diff-h')).not.toBeInTheDocument()
    render(<JsonDiff before={{ h: 'a' }} after={{ h: '<b>bold</b>' }} />)
    expect(screen.getByText('<b>bold</b>')).toBeInTheDocument()
    expect(document.querySelector('b')).toBeNull()
  })
})
