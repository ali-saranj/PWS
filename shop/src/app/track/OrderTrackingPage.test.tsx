import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as navigation from 'next/navigation';
import PaymentCallbackPage from '../checkout/callback/page';
import OrderTrackingPage from './[trackingCode]/page';
import TrackLookupPage from './page';
import { OrderTrackingTimeline } from '@/components/OrderTrackingTimeline';
import { useCartStore } from '@/lib/cartStore';

describe('Task 12: Payment Callback & Real-Time Order Tracking', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useCartStore.setState({
      items: [
        {
          id: 'item-1',
          productId: 1,
          variantId: 10,
          name: 'سوسیس کراکف پنیری',
          variantName: 'بسته ۵۰۰ گرمی',
          priceToman: 185000,
          quantity: 2,
        },
      ],
      isOpen: false,
    });
  });

  describe('Payment Callback Page (/checkout/callback)', () => {
    it('renders successful payment result, clears cart, and displays tracking CTA', async () => {
      vi.spyOn(navigation, 'useSearchParams').mockReturnValue(
        new URLSearchParams('Authority=A00000001234&Status=OK')
      );

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/shop/payments/zarinpal/callback')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  success: true,
                  trackingCode: 'TRK-987654',
                  orderNumber: 'ORD-1001',
                  refId: 'ZP-884422',
                })
              ),
            json: () =>
              Promise.resolve({
                success: true,
                trackingCode: 'TRK-987654',
                orderNumber: 'ORD-1001',
                refId: 'ZP-884422',
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('{}'),
          json: () => Promise.resolve({}),
        });
      });

      render(<PaymentCallbackPage />);

      await waitFor(() => {
        // Celebratory checkmark and success title
        expect(screen.getByText(/پرداخت با موفقیت انجام شد/i)).toBeInTheDocument();
      });

      // Cart should be cleared
      expect(useCartStore.getState().items).toHaveLength(0);

      // Order info displayed
      expect(screen.getByText(/ORD-1001/i)).toBeInTheDocument();
      expect(screen.getByText(/TRK-987654/i)).toBeInTheDocument();
      expect(screen.getByText(/ZP-884422/i)).toBeInTheDocument();

      // CTA button routing to /track/TRK-987654
      const trackBtn = screen.getByRole('link', { name: /پیگیری وضعیت سفارش/i });
      expect(trackBtn).toHaveAttribute('href', '/track/TRK-987654');

      // Return to store button
      const storeBtn = screen.getByRole('link', { name: /بازگشت به فروشگاه/i });
      expect(storeBtn).toHaveAttribute('href', '/');
    });

    it('renders failure alert when Status=NOK and provides payment retry CTA', async () => {
      vi.spyOn(navigation, 'useSearchParams').mockReturnValue(
        new URLSearchParams('Authority=A00000001234&Status=NOK')
      );

      render(<PaymentCallbackPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/تراکنش ناموفق بود یا توسط کاربر لغو شد/i)
        ).toBeInTheDocument();
      });

      // Retry CTA returns to /checkout
      const retryBtn = screen.getByRole('link', { name: /تلاش مجدد برای پرداخت/i });
      expect(retryBtn).toHaveAttribute('href', '/checkout');

      // Cart should not be emptied on failure
      expect(useCartStore.getState().items).toHaveLength(1);
    });

    it('renders failure alert when backend callback fails and does not synthesize fake tracking codes', async () => {
      vi.spyOn(navigation, 'useSearchParams').mockReturnValue(
        new URLSearchParams('Authority=A00000001234&Status=OK')
      );

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/shop/payments/zarinpal/callback')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: () => Promise.resolve('Error verifying payment'),
            json: () => Promise.resolve({ code: 'GATEWAY_ERROR' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('{}'),
          json: () => Promise.resolve({}),
        });
      });

      render(<PaymentCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText(/پرداخت ناموفق/i)).toBeInTheDocument();
      });

      // Does not synthesize fake tracking codes or claim success
      expect(screen.queryByText(/پرداخت با موفقیت انجام شد/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/TRK-/i)).not.toBeInTheDocument();
      expect(useCartStore.getState().items).toHaveLength(1);
    });
  });

  describe('OrderTrackingTimeline Component', () => {
    const mockTimelineEvents = [
      {
        status: 'AWAITING_APPROVAL' as const,
        timestamp: '2026-10-26T10:00:00Z',
        note: 'سفارش پرداخت شد و در انتظار تایید ادمین است.',
      },
      {
        status: 'APPROVED' as const,
        timestamp: '2026-10-26T10:15:00Z',
        note: 'سفارش توسط پشتیبانی تایید شد.',
      },
      {
        status: 'PREPARING' as const,
        timestamp: '2026-10-26T10:30:00Z',
        note: 'برش کالباس و بسته‌بندی در جریان است.',
      },
    ];

    it('renders the 5 main status steps and highlights active step', () => {
      render(
        <OrderTrackingTimeline
          status="PREPARING"
          timeline={mockTimelineEvents}
          courierNotes=""
        />
      );

      expect(screen.getAllByText(/ثبت و پرداخت سفارش/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/تایید ادمین/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/در حال آماده‌سازی و برش/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/تحویل به پیک و ارسال/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/تحویل داده شد/i).length).toBeGreaterThan(0);

      // Chronological status history events
      expect(screen.getByText(/برش کالباس و بسته‌بندی در جریان است/i)).toBeInTheDocument();
    });

    it('displays cancellation banner with refund info when CANCELLED', () => {
      render(
        <OrderTrackingTimeline
          status="CANCELLED"
          timeline={[
            {
              status: 'CANCELLED',
              timestamp: '2026-10-26T11:00:00Z',
              note: 'سفارش به دلیل عدم تایید یا درخواست خریدار لغو شد.',
            },
          ]}
          courierNotes=""
        />
      );

      expect(screen.getByText(/این سفارش لغو شده است/i)).toBeInTheDocument();
      expect(screen.getByText(/مبلغ پرداختی/i)).toBeInTheDocument();
    });

    it('shows courier notes when in DISPATCHED status', () => {
      render(
        <OrderTrackingTimeline
          status="DISPATCHED"
          timeline={mockTimelineEvents}
          courierNotes="پیک بادپا - شماره بارنامه: BP-998877"
        />
      );

      expect(screen.getByText(/پیک بادپا - شماره بارنامه: BP-998877/i)).toBeInTheDocument();
    });
  });

  describe('Order Tracking Page (/track/[trackingCode])', () => {
    it('fetches and renders order tracking details, items, and masked customer info', async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/shop/orders/track/TRK-123456')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  trackingCode: 'TRK-123456',
                  orderNumber: 'ORD-9020',
                  status: 'PREPARING',
                  placedAt: '2026-10-26T09:30:00Z',
                  paidAt: '2026-10-26T09:35:00Z',
                  recipientNameMasked: 'علی ر***',
                  recipientMobileMasked: '0912***4567',
                  province: 'تهران',
                  city: 'تهران',
                  courierNotes: 'ارسال با ون یخچال‌دار',
                  items: [
                    {
                      productNameFa: 'ژامبون بوقلمون دودی ۹۰٪',
                      productNameEn: 'Smoked Turkey Ham 90%',
                      variantLabelFa: 'برش اسلایس نازک ۳۰۰ گرم',
                      variantLabelEn: 'Thin Slices 300g',
                      qty: 2,
                    },
                  ],
                  timeline: [
                    {
                      status: 'AWAITING_APPROVAL',
                      timestamp: '2026-10-26T09:35:00Z',
                      note: 'ثبت سفارش انجام شد.',
                    },
                    {
                      status: 'PREPARING',
                      timestamp: '2026-10-26T10:00:00Z',
                      note: 'سفارش در حال برش و آماده‌سازی در پروتئینی است.',
                    },
                  ],
                })
              ),
            json: () =>
              Promise.resolve({
                trackingCode: 'TRK-123456',
                orderNumber: 'ORD-9020',
                status: 'PREPARING',
                placedAt: '2026-10-26T09:30:00Z',
                paidAt: '2026-10-26T09:35:00Z',
                recipientNameMasked: 'علی ر***',
                recipientMobileMasked: '0912***4567',
                province: 'تهران',
                city: 'تهران',
                courierNotes: 'ارسال با ون یخچال‌دار',
                items: [
                  {
                    productNameFa: 'ژامبون بوقلمون دودی ۹۰٪',
                    productNameEn: 'Smoked Turkey Ham 90%',
                    variantLabelFa: 'برش اسلایس نازک ۳۰۰ گرم',
                    variantLabelEn: 'Thin Slices 300g',
                    qty: 2,
                  },
                ],
                timeline: [
                  {
                    status: 'AWAITING_APPROVAL',
                    timestamp: '2026-10-26T09:35:00Z',
                    note: 'ثبت سفارش انجام شد.',
                  },
                ],
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('{}'),
          json: () => Promise.resolve({}),
        });
      });

      render(<OrderTrackingPage params={Promise.resolve({ trackingCode: 'TRK-123456' })} />);

      await waitFor(() => {
        expect(screen.getByText(/پیگیری سفارش/i)).toBeInTheDocument();
        expect(screen.getByText(/ORD-9020/i)).toBeInTheDocument();
        expect(screen.getByText(/TRK-123456/i)).toBeInTheDocument();
      });

      // Masked recipient details
      expect(screen.getByText(/علی ر\*\*\*/i)).toBeInTheDocument();
      expect(screen.getByText(/0912\*\*\*4567/i)).toBeInTheDocument();

      // Items table
      expect(screen.getByText(/ژامبون بوقلمون دودی ۹۰٪/i)).toBeInTheDocument();
      expect(screen.getByText(/برش اسلایس نازک ۳۰۰ گرم/i)).toBeInTheDocument();

      // Customer support link
      expect(screen.getByText(/پشتیبانی مشتریان/i)).toBeInTheDocument();
    });

    it('renders error state when tracking lookup returns 404 and does not show fake buyer data', async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/shop/orders/track/TRK-NONEXISTENT')) {
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: () => Promise.resolve('{"code":"NOT_FOUND"}'),
            json: () => Promise.resolve({ code: 'NOT_FOUND' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('{}'),
          json: () => Promise.resolve({}),
        });
      });

      render(<OrderTrackingPage params={Promise.resolve({ trackingCode: 'TRK-NONEXISTENT' })} />);

      await waitFor(() => {
        expect(screen.getByText(/سفارش یافت نشد/i)).toBeInTheDocument();
        expect(screen.getByText(/سفارش با این کد رهگیری یافت نشد/i)).toBeInTheDocument();
      });

      // Does NOT show fake order or fake customer name
      expect(screen.queryByText(/خریدار گرامی/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/پیک بادپا/i)).not.toBeInTheDocument();
    });
  });

  describe('Order Tracking Lookup Page (/track)', () => {
    it('submits tracking code and navigates to the tracking details page', async () => {
      const mockPush = vi.fn();
      vi.spyOn(navigation, 'useRouter').mockReturnValue({
        push: mockPush,
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
      });

      render(<TrackLookupPage />);

      const input = screen.getByPlaceholderText(/کد پیگیری را وارد کنید/i);
      fireEvent.change(input, { target: { value: 'TRK-778899' } });

      const submitBtn = screen.getByRole('button', { name: /رهگیری سفارش/i });
      fireEvent.click(submitBtn);

      expect(mockPush).toHaveBeenCalledWith('/track/TRK-778899');
    });
  });
});
