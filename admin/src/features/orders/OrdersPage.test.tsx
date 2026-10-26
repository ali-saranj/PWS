import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import type {
  AdminOrderDetailResponse,
  AdminOrderSummaryResponse,
  OrderStatusTransitionRequest,
} from '../../api/orders'
import type { Page } from '../../api/types'
import { visibleNavItems } from '../../layout/nav'
import { renderRoutes } from '../../test/renderRoutes'
import { server } from '../../test/server'

const operator = { id: 2, username: 'operator', fullName: 'Order Operator', role: 'ORDER_OPERATOR' as const }
const productManager = { id: 3, username: 'pm', fullName: 'Product Manager', role: 'PRODUCT_MANAGER' as const }

function mockSummary(id: number, over: Partial<AdminOrderSummaryResponse> = {}): AdminOrderSummaryResponse {
  return {
    id,
    orderNumber: `PWS-100${id}`,
    trackingCode: `TRK-100${id}`,
    customerMobile: '09121234567',
    recipientName: `Recipient ${id}`,
    totalRials: 1_250_000,
    status: 'AWAITING_APPROVAL',
    placedAt: '2026-10-26T10:00:00Z',
    needsAttention: false,
    itemCount: 2,
    ...over,
  }
}

function mockDetail(id: number, over: Partial<AdminOrderDetailResponse> = {}): AdminOrderDetailResponse {
  return {
    id,
    orderNumber: `PWS-100${id}`,
    trackingCode: `TRK-100${id}`,
    status: 'AWAITING_APPROVAL',
    customer: {
      id: 10,
      mobile: '09121234567',
      firstName: 'Ali',
      lastName: 'Rezaei',
    },
    deliveryAddress: {
      province: 'Tehran',
      city: 'Tehran',
      addressLine: 'Valiasr St, No 12',
      postalCode: '1234567890',
      recipientName: `Recipient ${id}`,
      recipientMobile: '09121234567',
    },
    items: [
      {
        id: 1,
        variantId: 101,
        productNameFa: 'پروتئین وی',
        productNameEn: 'Whey Protein',
        variantLabelFa: 'شکلات ۲ کیلوگرم',
        variantLabelEn: 'Chocolate 2kg',
        sku: 'WHEY-CHOC-2KG',
        unitPrice: 1_000_000,
        qty: 1,
        lineTotal: 1_000_000,
      },
    ],
    subtotalRials: 1_000_000,
    shippingCostRials: 250_000,
    discountTotalRials: 0,
    totalRials: 1_250_000,
    payment: {
      gateway: 'ZARINPAL',
      refId: 'ZP-123456',
      cardPanMasked: '6037-****-****-1234',
      status: 'PAID',
      amount: 1_250_000,
    },
    courierNotes: null,
    adminNotes: null,
    needsAttention: false,
    placedAt: '2026-10-26T10:00:00Z',
    paidAt: '2026-10-26T10:05:00Z',
    createdAt: '2026-10-26T10:00:00Z',
    updatedAt: '2026-10-26T10:05:00Z',
    statusHistory: [
      {
        id: 1,
        fromStatus: null,
        toStatus: 'PENDING_PAYMENT',
        actorType: 'CUSTOMER',
        actorId: 10,
        note: 'Order placed',
        createdAt: '2026-10-26T10:00:00Z',
      },
      {
        id: 2,
        fromStatus: 'PENDING_PAYMENT',
        toStatus: 'AWAITING_APPROVAL',
        actorType: 'SYSTEM',
        actorId: null,
        note: 'Payment successful',
        createdAt: '2026-10-26T10:05:00Z',
      },
    ],
    ...over,
  }
}

const page = (items: AdminOrderSummaryResponse[]): Page<AdminOrderSummaryResponse> => ({
  items,
  page: 0,
  size: 20,
  total: items.length,
})

describe('OrdersPage', () => {
  it('checks nav item role visibility', () => {
    expect(visibleNavItems('OWNER')).toContain('orders')
    expect(visibleNavItems('ORDER_OPERATOR')).toContain('orders')
    expect(visibleNavItems('PRODUCT_MANAGER')).not.toContain('orders')
  })

  it('blocks unauthorized access to /orders route for PRODUCT_MANAGER', async () => {
    renderRoutes('/orders', productManager)
    expect(await screen.findByText('No access')).toBeInTheDocument()
  })

  it('renders orders table with status chips', async () => {
    server.use(
      http.get('/api/admin/orders', () =>
        HttpResponse.json(page([
          mockSummary(1, { status: 'AWAITING_APPROVAL', totalRials: 1_250_000 }),
          mockSummary(2, { status: 'PREPARING', orderNumber: 'PWS-2002', totalRials: 3_400_000 }),
        ])),
      ),
    )

    renderRoutes('/orders', operator)

    expect(await screen.findByText('PWS-1001')).toBeInTheDocument()
    expect(screen.getByText('PWS-2002')).toBeInTheDocument()
    expect(screen.getByText('TRK-1001')).toBeInTheDocument()
    expect(screen.getAllByText('09121234567')).toHaveLength(2)
    expect(screen.getByText('125,000 Toman')).toBeInTheDocument()
    expect(screen.getByText('340,000 Toman')).toBeInTheDocument()

    const table = screen.getByRole('table')
    expect(within(table).getByText('Awaiting approval')).toBeInTheDocument()
    expect(within(table).getByText('Preparing')).toBeInTheDocument()
  })

  it('shows empty message when no orders exist', async () => {
    server.use(
      http.get('/api/admin/orders', () => HttpResponse.json(page([]))),
    )

    renderRoutes('/orders', operator)
    expect(await screen.findByText('Nothing here yet.')).toBeInTheDocument()
  })

  it('filters orders by search input with debounce', async () => {
    const seenQueries: (string | null)[] = []
    server.use(
      http.get('/api/admin/orders', ({ request }) => {
        const url = new URL(request.url)
        seenQueries.push(url.searchParams.get('q'))
        return HttpResponse.json(page([mockSummary(1)]))
      }),
    )

    renderRoutes('/orders', operator)

    await screen.findByText('PWS-1001')
    const searchInput = screen.getByLabelText(/Search|جستجو/i)
    await userEvent.type(searchInput, '0912')

    await waitFor(() => {
      expect(seenQueries).toContain('0912')
    })
  })

  it('filters orders by status tab', async () => {
    const seenStatuses: (string | null)[] = []
    server.use(
      http.get('/api/admin/orders', ({ request }) => {
        const url = new URL(request.url)
        seenStatuses.push(url.searchParams.get('status'))
        return HttpResponse.json(page([mockSummary(1)]))
      }),
    )

    renderRoutes('/orders', operator)

    await screen.findByText('PWS-1001')
    expect(seenStatuses[0]).toBeNull()

    const preparingTab = screen.getByRole('tab', { name: /Preparing/i })
    await userEvent.click(preparingTab)

    await waitFor(() => {
      expect(seenStatuses).toContain('PREPARING')
    })
  })

  it('opens order detail dialog and approves order', async () => {
    let transitionPayload: OrderStatusTransitionRequest | undefined
    server.use(
      http.get('/api/admin/orders', () =>
        HttpResponse.json(page([mockSummary(1, { status: 'AWAITING_APPROVAL' })])),
      ),
      http.get('/api/admin/orders/1', () =>
        HttpResponse.json(mockDetail(1, { status: 'AWAITING_APPROVAL' })),
      ),
      http.post('/api/admin/orders/1/status', async ({ request }) => {
        transitionPayload = (await request.json()) as OrderStatusTransitionRequest
        return HttpResponse.json(mockDetail(1, { status: 'APPROVED' }))
      }),
    )

    renderRoutes('/orders', operator)

    const viewButton = await screen.findByRole('button', { name: /View|مشاهده/i })
    await userEvent.click(viewButton)

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getAllByText('PWS-1001').length).toBeGreaterThanOrEqual(1)
    expect(within(dialog).getByText('Whey Protein')).toBeInTheDocument()
    expect(within(dialog).getByText(/Valiasr St, No 12/)).toBeInTheDocument()
    expect(within(dialog).getByText('ZP-123456')).toBeInTheDocument()

    const approveButton = within(dialog).getByRole('button', { name: /Approve|تایید سفارش/i })
    await userEvent.click(approveButton)

    await waitFor(() => {
      expect(transitionPayload).toMatchObject({
        targetStatus: 'APPROVED',
      })
    })
  })

  it('starts preparing approved order', async () => {
    let transitionPayload: OrderStatusTransitionRequest | undefined
    server.use(
      http.get('/api/admin/orders', () =>
        HttpResponse.json(page([mockSummary(3, { status: 'APPROVED' })])),
      ),
      http.get('/api/admin/orders/3', () =>
        HttpResponse.json(mockDetail(3, { status: 'APPROVED' })),
      ),
      http.post('/api/admin/orders/3/status', async ({ request }) => {
        transitionPayload = (await request.json()) as OrderStatusTransitionRequest
        return HttpResponse.json(mockDetail(3, { status: 'PREPARING' }))
      }),
    )

    renderRoutes('/orders', operator)

    const viewButton = await screen.findByRole('button', { name: /View|مشاهده/i })
    await userEvent.click(viewButton)

    const dialog = await screen.findByRole('dialog')
    const startPrepButton = within(dialog).getByRole('button', { name: /Start preparing|شروع آماده‌سازی/i })
    await userEvent.click(startPrepButton)

    await waitFor(() => {
      expect(transitionPayload).toMatchObject({
        targetStatus: 'PREPARING',
      })
    })
  })

  it('dispatches preparing order with courier notes', async () => {
    let transitionPayload: OrderStatusTransitionRequest | undefined
    server.use(
      http.get('/api/admin/orders', () =>
        HttpResponse.json(page([mockSummary(2, { status: 'PREPARING' })])),
      ),
      http.get('/api/admin/orders/2', () =>
        HttpResponse.json(mockDetail(2, { status: 'PREPARING' })),
      ),
      http.post('/api/admin/orders/2/status', async ({ request }) => {
        transitionPayload = (await request.json()) as OrderStatusTransitionRequest
        return HttpResponse.json(mockDetail(2, { status: 'DISPATCHED', courierNotes: 'Tipax 987654' }))
      }),
    )

    renderRoutes('/orders', operator)

    const viewButton = await screen.findByRole('button', { name: /View|مشاهده/i })
    await userEvent.click(viewButton)

    const dialog = await screen.findByRole('dialog')
    const dispatchButton = within(dialog).getByRole('button', { name: /Dispatch|ارسال با پیک/i })
    await userEvent.click(dispatchButton)

    // Courier notes input appears
    const courierInput = await screen.findByLabelText(/Courier notes|یادداشت پیک/i)
    await userEvent.type(courierInput, 'Tipax 987654')

    const confirmButton = screen.getByRole('button', { name: /Confirm|تایید/i })
    await userEvent.click(confirmButton)

    await waitFor(() => {
      expect(transitionPayload).toMatchObject({
        targetStatus: 'DISPATCHED',
        courierNotes: 'Tipax 987654',
      })
    })
  })

  it('marks dispatched order as delivered', async () => {
    let transitionPayload: OrderStatusTransitionRequest | undefined
    server.use(
      http.get('/api/admin/orders', () =>
        HttpResponse.json(page([mockSummary(4, { status: 'DISPATCHED' })])),
      ),
      http.get('/api/admin/orders/4', () =>
        HttpResponse.json(mockDetail(4, { status: 'DISPATCHED' })),
      ),
      http.post('/api/admin/orders/4/status', async ({ request }) => {
        transitionPayload = (await request.json()) as OrderStatusTransitionRequest
        return HttpResponse.json(mockDetail(4, { status: 'DELIVERED' }))
      }),
    )

    renderRoutes('/orders', operator)

    const viewButton = await screen.findByRole('button', { name: /View|مشاهده/i })
    await userEvent.click(viewButton)

    const dialog = await screen.findByRole('dialog')
    const deliveredButton = within(dialog).getByRole('button', { name: /Mark delivered|تحویل به مشتری/i })
    await userEvent.click(deliveredButton)

    await waitFor(() => {
      expect(transitionPayload).toMatchObject({
        targetStatus: 'DELIVERED',
      })
    })
  })

  it('cancels order with optional note', async () => {
    let transitionPayload: OrderStatusTransitionRequest | undefined
    server.use(
      http.get('/api/admin/orders', () =>
        HttpResponse.json(page([mockSummary(1, { status: 'AWAITING_APPROVAL' })])),
      ),
      http.get('/api/admin/orders/1', () =>
        HttpResponse.json(mockDetail(1, { status: 'AWAITING_APPROVAL' })),
      ),
      http.post('/api/admin/orders/1/status', async ({ request }) => {
        transitionPayload = (await request.json()) as OrderStatusTransitionRequest
        return HttpResponse.json(mockDetail(1, { status: 'CANCELLED', adminNotes: 'Customer request' }))
      }),
    )

    renderRoutes('/orders', operator)

    const viewButton = await screen.findByRole('button', { name: /View|مشاهده/i })
    await userEvent.click(viewButton)

    const dialog = await screen.findByRole('dialog')
    const cancelButton = within(dialog).getByRole('button', { name: /Cancel order|لغو سفارش/i })
    await userEvent.click(cancelButton)

    const noteInput = await screen.findByLabelText(/Reason|note|علت|توضیحات/i)
    await userEvent.type(noteInput, 'Customer request')

    const confirmCancel = screen.getByRole('button', { name: /Confirm|تایید/i })
    await userEvent.click(confirmCancel)

    await waitFor(() => {
      expect(transitionPayload).toMatchObject({
        targetStatus: 'CANCELLED',
        note: 'Customer request',
      })
    })
  })
})
