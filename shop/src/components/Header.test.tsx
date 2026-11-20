import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { Header } from './Header';
import { useCartStore } from '@/lib/cartStore';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Header component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(screen.getByTestId('brand-title-mobile')).toHaveTextContent('پروتئین ایرانی');
    expect(screen.getByTestId('brand-title-desktop')).toHaveTextContent(
      'پروتئین ایرانی - فروشگاه تخصصی فرآورده‌های پروتئینی'
    );
  });

  it('renders inline search bar that submits query', () => {
    render(<Header />);
    const searchInput = screen.getByPlaceholderText(
      'جستجو در پروتئین ایرانی...'
    );
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'سوسیس' } });
    fireEvent.submit(searchInput.closest('form')!);

    expect(mockPush).toHaveBeenCalledWith('/search?q=%D8%B3%D9%88%D8%B3%DB%8C%D8%B3');
  });

  it('opens and closes slide-over menu drawer on mobile', () => {
    render(<Header />);
    const menuBtn = screen.getByRole('button', { name: 'منوی سایت' });
    expect(menuBtn).toBeInTheDocument();

    // Drawer is closed initially
    expect(screen.queryByTestId('mobile-drawer')).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(menuBtn);
    const drawer = screen.getByTestId('mobile-drawer');
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: /تخفیف‌ها/i })).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: 'پیگیری سفارش' })).toBeInTheDocument();

    // Click close button
    const closeBtn = screen.getByRole('button', { name: 'بستن منو' });
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('mobile-drawer')).not.toBeInTheDocument();
  });

  it('renders customer login/register button linking to /profile on desktop', () => {
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

  it('renders sub-navigation links and city delivery badge on desktop', () => {
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

  it('displays live autocomplete dropdown when typing search query', async () => {
    const mockSuggestions = [
      {
        id: 101,
        slug: 'sausage-cocktail',
        nameFa: 'سوسیس کوکتل دودی',
        priceToman: 180000,
        thumbnailUrl: '/media/s.jpg',
        categoryNameFa: 'سوسیس',
      },
    ];
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url.includes('/api/shop/catalog/search/suggest')) {
        return mockSuggestions;
      }
      return null;
    });

    render(<Header />);
    const searchInput = screen.getByPlaceholderText('جستجو در پروتئین ایرانی...');
    fireEvent.change(searchInput, { target: { value: 'کوکتل' } });

    await waitFor(() => {
      expect(screen.getByTestId('search-suggestions-dropdown')).toBeInTheDocument();
      expect(screen.getByText('سوسیس کوکتل دودی')).toBeInTheDocument();
      expect(screen.getByText(/۱۸۰,۰۰۰/)).toBeInTheDocument();
    });

    // Press Escape to dismiss
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('search-suggestions-dropdown')).not.toBeInTheDocument();
  });
});
