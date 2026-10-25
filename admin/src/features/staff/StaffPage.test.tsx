import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import i18n from '../../i18n'
import type { AuditEntryDto, Page, StaffDto } from '../../api/types'
import { renderRoutes } from '../../test/renderRoutes'
import { server } from '../../test/server'

const owner = { id: 1, username: 'owner', fullName: 'Main Owner', role: 'OWNER' as const }
const staff = (id: number, over: Partial<StaffDto> = {}): StaffDto => ({
  id, username: `user${id}`, fullName: `Person ${id}`, mobile: '09120000000', role: 'PRODUCT_MANAGER', active: true, version: 3, ...over,
})
const lastOwner = () =>
  HttpResponse.json(
    { code: 'VALIDATION_FAILED', messages: { fa: 'نامعتبر', en: 'Invalid' }, errors: [{ field: 'role', code: 'LAST_OWNER', message: 'At least one owner is required' }] },
    { status: 400 },
  )

describe('StaffPage', () => {
  it('LAST_OWNER error shown on role field', async () => {
    server.use(
      http.get('/api/admin/staff', () => HttpResponse.json([staff(1, { username: 'owner', role: 'OWNER' }), staff(2)])),
      http.put('/api/admin/staff/2', lastOwner),
    )
    renderRoutes('/staff', owner)
    await userEvent.click(await screen.findByRole('button', { name: 'Edit: user2' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(await within(dialog).findByText('At least one owner is required')).toBeInTheDocument()
    expect(within(dialog).getByRole('combobox', { name: 'Role' })).toHaveAttribute('aria-invalid', 'true')
  })

  it('confirms before changing own role, then sends the update', async () => {
    let body: unknown
    server.use(
      http.get('/api/admin/staff', () => HttpResponse.json([staff(1, { username: 'owner', role: 'OWNER' })])),
      http.put('/api/admin/staff/1', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(staff(1))
      }),
    )
    renderRoutes('/staff', owner)
    await userEvent.click(await screen.findByRole('button', { name: 'Edit: owner' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Role' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Product manager' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(body).toBeUndefined()
    const confirm = await screen.findByText(/lose access/i)
    await userEvent.click(within(confirm.closest('[role="dialog"]') as HTMLElement).getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(body).toMatchObject({ role: 'PRODUCT_MANAGER', version: 3, active: true }))
  })

  it('creates staff, normalising Persian digits in the mobile', async () => {
    let body: unknown
    server.use(
      http.get('/api/admin/staff', () => HttpResponse.json([])),
      http.post('/api/admin/staff', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(staff(5), { status: 201 })
      }),
    )
    renderRoutes('/staff', owner)
    await userEvent.click(await screen.findByRole('button', { name: 'Add staff member' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Username'), 'newbie')
    await userEvent.type(within(dialog).getByLabelText('Full name'), 'New Bie')
    await userEvent.type(within(dialog).getByLabelText('Mobile'), '۰۹۱۲۱۱۱۲۲۲۲')
    await userEvent.type(within(dialog).getByLabelText('Password'), 'short')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(await within(dialog).findByText('Password must be at least 10 characters.')).toBeInTheDocument()
    expect(body).toBeUndefined()
    await userEvent.clear(within(dialog).getByLabelText('Password'))
    await userEvent.type(within(dialog).getByLabelText('Password'), 'long-enough-password')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(body).toMatchObject({ username: 'newbie', fullName: 'New Bie', mobile: '09121112222', password: 'long-enough-password', role: 'PRODUCT_MANAGER' }),
    )
  })

  it('rejects passwords over 72 bytes in the reset dialog', async () => {
    let called = false
    server.use(
      http.get('/api/admin/staff', () => HttpResponse.json([staff(2)])),
      http.post('/api/admin/staff/2/password', () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderRoutes('/staff', owner)
    await userEvent.click(await screen.findByRole('button', { name: 'Reset password: user2' }))
    const dialog = await screen.findByRole('dialog')
    // 40 Persian letters = 80 UTF-8 bytes but only 40 characters
    await userEvent.type(within(dialog).getByLabelText('New password'), 'ا'.repeat(40))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reset password' }))
    expect(await within(dialog).findByText('Password must be at most 72 bytes.')).toBeInTheDocument()
    expect(called).toBe(false)
  })
})

describe('AuditPage', () => {
  const entry: AuditEntryDto = {
    id: 1, staffUsername: 'owner', action: 'STAFF_UPDATE', entityType: 'STAFF_USER', entityId: 2,
    before: { role: 'ORDER_OPERATOR' }, after: { role: 'OWNER' }, ip: '1.2.3.4', createdAt: '2026-10-25T10:00:00Z',
  }
  const page = (items: AuditEntryDto[]): Page<AuditEntryDto> => ({ items, page: 0, size: 20, total: items.length })

  it('audit dates render in Jalali for fa', async () => {
    server.use(
      http.get('/api/admin/staff', () => HttpResponse.json([staff(1)])),
      http.get('/api/admin/audit', () => HttpResponse.json(page([entry]))),
    )
    renderRoutes('/audit', owner)
    expect(await screen.findByText('Oct 25, 2026, 1:30 PM')).toBeInTheDocument()
    await act(() => i18n.changeLanguage('fa'))
    expect(await screen.findByText(/۱۴۰۵\/۰۸\/۰۳/)).toBeInTheDocument()
    await act(() => i18n.changeLanguage('en'))
  })

  it('filters by entity type and expands a row into a diff', async () => {
    const seen: (string | null)[] = []
    server.use(
      http.get('/api/admin/staff', () => HttpResponse.json([staff(1)])),
      http.get('/api/admin/audit', ({ request }) => {
        seen.push(new URL(request.url).searchParams.get('entityType'))
        return HttpResponse.json(page([entry]))
      }),
    )
    renderRoutes('/audit', owner)
    await userEvent.click(await screen.findByRole('button', { name: 'Show changes: 1' }))
    expect(await screen.findByTestId('diff-role')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('combobox', { name: 'Entity type' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Brand' }))
    await waitFor(() => expect(seen).toContain('BRAND'))
  })
})
