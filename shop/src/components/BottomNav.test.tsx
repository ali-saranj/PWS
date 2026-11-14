import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav } from './BottomNav';
import { useCartStore } from '@/lib/cartStore';
import { useAuthStore } from '@/lib/authStore';

let currentPathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('BottomNav component', () => {
  beforeEach(() => {
    currentPathname = '/';
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

  it('renders 4 navigation tabs: Home, Categories, Cart, and Profile', () => {
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: /خانه/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /دسته‌بندی‌ها/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /سبد خرید/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /پروفایل|ورود|حساب/i })).toBeInTheDocument();
  });

  it('highlights the active link based on pathname', () => {
    currentPathname = '/categories';
    render(<BottomNav />);
    const categoriesLink = screen.getByRole('link', { name: /دسته‌بندی‌ها/i });
    expect(categoriesLink).toHaveClass('text-primary');
  });

  it('triggers toggleCart when cart tab button is clicked', () => {
    const toggleSpy = vi.fn();
    useCartStore.setState({ toggleCart: toggleSpy });

    render(<BottomNav />);
    const cartButton = screen.getByRole('button', { name: /سبد خرید/i });
    fireEvent.click(cartButton);
    expect(toggleSpy).toHaveBeenCalledTimes(1);
  });

  it('displays Persian badge count when cart has items', () => {
    useCartStore.setState({
      items: [
        {
          id: 'item-1',
          productId: 1,
          variantId: 1,
          name: 'سوسیس فرانکفورتر',
          variantName: '۵۰۰ گرم',
          priceToman: 180000,
          quantity: 3,
        },
      ],
    });

    render(<BottomNav />);
    const badge = screen.getByTestId('bottom-cart-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('۳');
  });

  it('shows customer first name when authenticated', () => {
    useAuthStore.setState({
      customer: {
        id: 1,
        mobile: '09123456789',
        firstName: 'سارا',
        lastName: 'محمدی',
      },
      isAuthenticated: true,
      isLoading: false,
    });

    render(<BottomNav />);
    expect(screen.getByText('سارا')).toBeInTheDocument();
  });
});
