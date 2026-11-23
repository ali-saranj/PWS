import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutPage from './page';
import { useCartStore } from '@/lib/cartStore';
import { useAuthStore } from '@/lib/authStore';

// Mock window.location.href
const originalLocation = window.location;

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useCartStore.setState({
      items: [],
      isOpen: false,
    });
    useAuthStore.setState({
      customer: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // Mock window.location for payment redirect
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/shop/auth/me')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          text: () => Promise.resolve('{"error":"UNAUTHORIZED"}'),
          json: () => Promise.resolve({ error: 'UNAUTHORIZED' }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{}'),
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    window.location = originalLocation as any;
  });

  it('renders empty cart state when no items are in cart', () => {
    render(<CheckoutPage />);
    expect(screen.getByText(/سبد خرید شما خالی است/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /مشاهده محصولات/i })).toBeInTheDocument();
  });

  it('renders cart summary and prompts for OTP login when customer is unauthenticated', async () => {
    useCartStore.setState({
      items: [
        {
          id: 'item-1',
          productId: 101,
          variantId: 201,
          name: 'سوسیس فرانکفورتر ۸۰٪',
          variantName: '۵۰۰ گرم',
          priceToman: 180000,
          quantity: 2,
        },
      ],
    });

    render(<CheckoutPage />);

    // Cart items and subtotal are visible
    expect(screen.getByText(/سوسیس فرانکفورتر ۸۰٪/i)).toBeInTheDocument();
    expect(screen.getAllByText(/۳۶۰,۰۰۰/i).length).toBeGreaterThan(0);

    // Prompts for login/OTP
    expect(screen.getByText(/ورود یا ثبت‌نام جهت تکمیل خرید/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/۰۹xxxxxxxxx|۰۹۱۲۳۴۵۶۷۸۹/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ارسال کد تایید/i })).toBeInTheDocument();
  });

  it('allows sending OTP and verifying code to sign in during checkout', async () => {
    useCartStore.setState({
      items: [
        {
          id: 'item-1',
          productId: 101,
          variantId: 201,
          name: 'سوسیس فرانکفورتر ۸۰٪',
          variantName: '۵۰۰ گرم',
          priceToman: 180000,
          quantity: 2,
        },
      ],
    });

    // Mock fetch for send OTP and verify OTP and get addresses
    const fetchMock = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/shop/auth/me')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          text: () => Promise.resolve('{"error":"UNAUTHORIZED"}'),
          json: () => Promise.resolve({ error: 'UNAUTHORIZED' }),
        });
      }
      if (url.includes('/api/shop/auth/otp')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(''),
          json: () => Promise.resolve({}),
        });
      }
      if (url.includes('/api/shop/auth/verify')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({
            id: 12,
            mobile: '09123456789',
            firstName: 'رضا',
            lastName: 'محمدی',
          })),
          json: () => Promise.resolve({
            id: 12,
            mobile: '09123456789',
            firstName: 'رضا',
            lastName: 'محمدی',
          }),
        });
      }
      if (url.includes('/api/shop/customer/addresses')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify([])),
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{}'),
        json: () => Promise.resolve({}),
      });
    });

    global.fetch = fetchMock;

    render(<CheckoutPage />);

    // Step 1: Enter mobile number
    const mobileInput = screen.getByPlaceholderText(/۰۹xxxxxxxxx|۰۹۱۲۳۴۵۶۷۸۹/i);
    fireEvent.change(mobileInput, { target: { value: '09123456789' } });

    const sendOtpBtn = screen.getByRole('button', { name: /ارسال کد تایید/i });
    fireEvent.click(sendOtpBtn);

    // Step 2: OTP step appears
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/کد ۵ رقمی/i)).toBeInTheDocument();
    });

    const codeInput = screen.getByPlaceholderText(/کد ۵ رقمی/i);
    fireEvent.change(codeInput, { target: { value: '12345' } });

    const verifyBtn = screen.getByRole('button', { name: /تایید و ادامه/i });
    fireEvent.click(verifyBtn);

    // After login, customer name / address selection should appear
    await waitFor(() => {
      expect(screen.getByText(/رضا محمدی/i)).toBeInTheDocument();
    });
  });

  it('allows selecting address, shipping method, and submitting checkout to redirect to Zarinpal', async () => {
    useCartStore.setState({
      items: [
        {
          id: 'item-1',
          productId: 101,
          variantId: 201,
          name: 'ژامبون بوقلمون ۹۰٪',
          variantName: '۲۵۰ گرم',
          priceToman: 240000,
          quantity: 1,
        },
      ],
    });

    useAuthStore.setState({
      customer: {
        id: 15,
        mobile: '09129876543',
        firstName: 'سارا',
        lastName: 'کریمی',
      },
      isAuthenticated: true,
      isLoading: false,
    });

    const mockAddresses = [
      {
        id: 101,
        customerId: 15,
        province: 'تهران',
        city: 'تهران',
        line: 'سعادت‌آباد، بلوار شهرداری، پلاک ۱۲',
        postalCode: '1998765432',
        recipientName: 'سارا کریمی',
        recipientMobile: '09129876543',
        isDefault: true,
        createdAt: '2026-10-26T10:00:00Z',
      },
    ];

    const fetchMock = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/shop/customer/addresses')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify(mockAddresses)),
          json: () => Promise.resolve(mockAddresses),
        });
      }
      if (url.includes('/api/shop/checkout') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({
            orderNumber: 'ORD-20261026-99',
            trackingCode: 'TRK-987654',
            paymentUrl: 'https://sandbox.zarinpal.com/pg/StartPay/00000000-0000-0000-0000-000000000001',
            authority: '00000000-0000-0000-0000-000000000001',
          })),
          json: () => Promise.resolve({
            orderNumber: 'ORD-20261026-99',
            trackingCode: 'TRK-987654',
            paymentUrl: 'https://sandbox.zarinpal.com/pg/StartPay/00000000-0000-0000-0000-000000000001',
            authority: '00000000-0000-0000-0000-000000000001',
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

    global.fetch = fetchMock;

    render(<CheckoutPage />);

    // Address is displayed and selected
    await waitFor(() => {
      expect(screen.getByText(/سعادت‌آباد، بلوار شهرداری، پلاک ۱۲/i)).toBeInTheDocument();
    });

    // Shipping method is available
    expect(screen.getByText(/ارسال اکسپرس با پیک شهری/i)).toBeInTheDocument();

    // Click online payment button
    const payBtn = screen.getByRole('button', { name: /پرداخت آنلاین شاپرک/i });
    expect(payBtn).not.toBeDisabled();
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/shop/checkout'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            items: [{ variantId: 201, qty: 1 }],
            addressId: 101,
            shippingMethodId: 1,
            customerNote: '',
          }),
        })
      );
    });

    // Window location should be redirected to Zarinpal
    await waitFor(() => {
      expect(window.location.href).toBe(
        'https://sandbox.zarinpal.com/pg/StartPay/00000000-0000-0000-0000-000000000001'
      );
    });
  });

  it('renders localized error message when checkout fails with gateway error details', async () => {
    useCartStore.setState({
      items: [
        {
          id: 'item-1',
          productId: 101,
          variantId: 201,
          name: 'ژامبون بوقلمون ۹۰٪',
          variantName: '۲۵۰ گرم',
          priceToman: 240000,
          quantity: 1,
        },
      ],
    });

    useAuthStore.setState({
      customer: {
        id: 15,
        mobile: '09129876543',
        firstName: 'سارا',
        lastName: 'کریمی',
      },
      isAuthenticated: true,
      isLoading: false,
    });

    const mockAddresses = [
      {
        id: 101,
        customerId: 15,
        province: 'تهران',
        city: 'تهران',
        line: 'سعادت‌آباد، بلوار شهرداری، پلاک ۱۲',
        postalCode: '1998765432',
        recipientName: 'سارا کریمی',
        recipientMobile: '09129876543',
        isDefault: true,
        createdAt: '2026-10-26T10:00:00Z',
      },
    ];

    const problemError = {
      type: 'https://api.pws.ir/errors/PAYMENT_GATEWAY_ERROR',
      status: 502,
      code: 'PAYMENT_GATEWAY_ERROR',
      messages: {
        fa: 'خطا در برقراری ارتباط با درگاه پرداخت بانکی.',
        en: 'Error communicating with the payment gateway.',
      },
      errors: [
        {
          field: 'gateway',
          code: 'GATEWAY_DEACTIVATED',
          message: 'درگاه پرداخت در حال حاضر غیرفعال است.',
        },
      ],
    };

    const fetchMock = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/shop/customer/addresses')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify(mockAddresses)),
          json: () => Promise.resolve(mockAddresses),
        });
      }
      if (url.includes('/api/shop/checkout') && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 502,
          statusText: 'Bad Gateway',
          text: () => Promise.resolve(JSON.stringify(problemError)),
          json: () => Promise.resolve(problemError),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{}'),
        json: () => Promise.resolve({}),
      });
    });

    global.fetch = fetchMock;

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByText(/سعادت‌آباد، بلوار شهرداری، پلاک ۱۲/i)).toBeInTheDocument();
    });

    const payBtn = screen.getByRole('button', { name: /پرداخت آنلاین شاپرک/i });
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(screen.getByText('درگاه پرداخت در حال حاضر غیرفعال است.')).toBeInTheDocument();
    });
  });
});
