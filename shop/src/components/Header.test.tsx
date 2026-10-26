import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';
import { useCartStore } from '@/lib/cartStore';
import { useAuthStore } from '@/lib/authStore';

describe('Header component', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      isOpen: false,
    });
    useAuthStore.setState({
      customer: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('renders brand name and logo text', () => {
    render(<Header />);
    expect(screen.getByText(/سبد سبز - سوپرمارکت آنلاین/)).toBeInTheDocument();
  });

  it('renders search bar with input placeholder and submit button', () => {
    render(<Header />);
    const searchInputs = screen.getAllByPlaceholderText(
      'جستجوی محصول، برند یا دسته‌بندی...'
    );
    expect(searchInputs.length).toBeGreaterThan(0);
    expect(searchInputs[0]).toBeInTheDocument();
    const searchButtons = screen.getAllByRole('button', { name: /جستجو/i });
    expect(searchButtons[0]).toBeInTheDocument();
  });

  it('renders customer login/register button linking to /profile', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: /ورود \/ ثبت نام/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/profile');
  });

  it('renders user first name linking to /profile when authenticated', () => {
    useAuthStore.setState({
      customer: {
        id: 10,
        mobile: '09121112233',
        firstName: 'سارا',
        lastName: 'بهرامی',
      },
      isAuthenticated: true,
      isLoading: false,
    });

    render(<Header />);
    const link = screen.getByRole('link', { name: /سارا/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/profile');
  });

  it('renders cart button with item count and price in Toman', () => {
    render(<Header />);
    expect(screen.getByText('سبد خرید')).toBeInTheDocument();
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('۰');
  });

  it('updates cart badge and total when items are in cart', () => {
    useCartStore.setState({
      items: [
        {
          id: 'item-1',
          productId: 101,
          variantId: 201,
          name: 'ژامبون گوشت ۹۰٪',
          variantName: '۵۰۰ گرم',
          priceToman: 250000,
          quantity: 2,
          imageUrl: '/images/ham.jpg',
        },
      ],
      isOpen: false,
    });

    render(<Header />);
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('۲');
    expect(screen.getByText(/۵۰۰,۰۰۰/)).toBeInTheDocument();
    expect(screen.getByText(/تومان/)).toBeInTheDocument();
  });

  it('renders sub-navigation links and city delivery badge', () => {
    render(<Header />);
    expect(screen.getByText('صفحه اصلی')).toBeInTheDocument();
    expect(screen.getByText('محصولات')).toBeInTheDocument();
    expect(screen.getByText('تخفیف‌ها')).toBeInTheDocument();
    expect(screen.getByText('برندها')).toBeInTheDocument();
    expect(screen.getByText('دسته‌بندی‌ها')).toBeInTheDocument();
    expect(screen.getByText('درباره ما')).toBeInTheDocument();
    expect(screen.getByText('تماس با ما')).toBeInTheDocument();
    expect(screen.getByText(/تهران - ارسال سریع/)).toBeInTheDocument();
  });
});
