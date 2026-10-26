import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from './page';
import { useAuthStore } from '@/lib/authStore';

const mockResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  text: () => Promise.resolve(JSON.stringify(data)),
  json: () => Promise.resolve(data),
});

describe('ProfilePage (Customer Portal Hub)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      customer: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/shop/auth/me')) {
        return Promise.resolve(mockResponse({ error: 'UNAUTHORIZED' }, 401));
      }
      if (url.includes('/api/shop/customer/orders')) {
        return Promise.resolve(mockResponse([]));
      }
      if (url.includes('/api/shop/customer/addresses')) {
        return Promise.resolve(mockResponse([]));
      }
      if (url.includes('/api/shop/auth/logout')) {
        return Promise.resolve(mockResponse({ success: true }));
      }
      return Promise.resolve(mockResponse({}));
    });
  });

  it('renders unauthenticated prompt card and clicking button opens QuickAuthModal', async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('ورود به حساب کاربری')).toBeInTheDocument();
    });

    expect(
      screen.getByText('برای مشاهده سفارش‌ها و مدیریت حساب خود، لطفاً وارد شوید.')
    ).toBeInTheDocument();

    const loginButton = screen.getByRole('button', { name: /ورود یا ثبت‌نام/i });
    expect(loginButton).toBeInTheDocument();

    // QuickAuthModal should open upon clicking
    fireEvent.click(loginButton);

    expect(screen.getByPlaceholderText('۰۹۱۲۳۴۵۶۷۸۹')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ارسال کد تایید/i })).toBeInTheDocument();
  });

  it('renders authenticated customer summary card and default active OrdersTab', async () => {
    useAuthStore.setState({
      customer: {
        id: 1,
        mobile: '09121234567',
        firstName: 'رضا',
        lastName: 'کرمی',
        email: 'reza@example.com',
      },
      isAuthenticated: true,
      isLoading: false,
    });

    render(<ProfilePage />);

    // Customer summary card
    expect(screen.getByText('رضا کرمی')).toBeInTheDocument();
    expect(screen.getByText('۰۹۱۲۱۲۳۴۵۶۷')).toBeInTheDocument();
    expect(screen.getByText('reza@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /خروج از حساب/i })).toBeInTheDocument();

    // Default active tab should be سفارش‌های من
    const ordersTabBtn = screen.getByRole('button', { name: /سفارش‌های من/i });
    expect(ordersTabBtn).toBeInTheDocument();

    // Wait for OrdersTab to fetch and render empty state
    await waitFor(() => {
      expect(screen.getByText('هنوز سفارشی ثبت نکرده‌اید')).toBeInTheDocument();
    });
  });

  it('switches between tabs without full page reload', async () => {
    useAuthStore.setState({
      customer: {
        id: 1,
        mobile: '09121234567',
        firstName: 'رضا',
        lastName: 'کرمی',
        email: null,
      },
      isAuthenticated: true,
      isLoading: false,
    });

    render(<ProfilePage />);

    // Click AddressBookTab
    const addressTabBtn = screen.getByRole('button', { name: /آدرس‌های تحویل/i });
    fireEvent.click(addressTabBtn);

    await waitFor(() => {
      expect(screen.getByText('افزودن آدرس جدید')).toBeInTheDocument();
    });

    // Click PersonalInfoTab
    const personalTabBtn = screen.getByRole('button', { name: /اطلاعات حساب/i });
    fireEvent.click(personalTabBtn);

    await waitFor(() => {
      expect(screen.getByText('اطلاعات حساب کاربری')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ذخیره تغییرات/i })).toBeInTheDocument();
    });

    // Click back to OrdersTab
    const ordersTabBtn = screen.getByRole('button', { name: /سفارش‌های من/i });
    fireEvent.click(ordersTabBtn);

    await waitFor(() => {
      expect(screen.getByText('هنوز سفارشی ثبت نکرده‌اید')).toBeInTheDocument();
    });
  });

  it('calls logout when logout button is clicked', async () => {
    const logoutSpy = vi.fn().mockImplementation(async () => {
      useAuthStore.setState({
        customer: null,
        isAuthenticated: false,
      });
    });

    useAuthStore.setState({
      customer: {
        id: 1,
        mobile: '09121234567',
        firstName: 'رضا',
        lastName: 'کرمی',
      },
      isAuthenticated: true,
      logout: logoutSpy,
    });

    render(<ProfilePage />);

    const logoutBtn = screen.getByRole('button', { name: /خروج از حساب/i });
    fireEvent.click(logoutBtn);

    expect(logoutSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('ورود به حساب کاربری')).toBeInTheDocument();
    });
  });
});
