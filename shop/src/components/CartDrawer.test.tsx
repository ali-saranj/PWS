import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CartDrawer from './CartDrawer';
import { useCartStore } from '@/lib/cartStore';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('CartDrawer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useCartStore.setState({
      items: [],
      isOpen: false,
    });
  });

  it('does not render when isOpen is false', () => {
    render(<CartDrawer />);
    expect(screen.queryByText(/سبد خرید شما/i)).not.toBeInTheDocument();
  });

  it('renders empty cart state when open and no items', () => {
    useCartStore.setState({ isOpen: true, items: [] });
    render(<CartDrawer />);

    expect(screen.getByText(/سبد خرید شما خالی است/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /مشاهده محصولات/i })).toBeInTheDocument();
  });

  it('renders cart items, portion labels, unit prices, and subtotal when open', () => {
    useCartStore.setState({
      isOpen: true,
      items: [
        {
          id: 'item-1',
          productId: 10,
          variantId: 20,
          name: 'کالباس پپرونی ۹۰٪',
          variantName: '۳۰۰ گرم اسلایس',
          priceToman: 195000,
          quantity: 2,
        },
      ],
    });

    render(<CartDrawer />);

    expect(screen.getByText(/کالباس پپرونی ۹۰٪/i)).toBeInTheDocument();
    expect(screen.getByText(/۳۰۰ گرم اسلایس/i)).toBeInTheDocument();
    expect(screen.getByText(/۱۹۵,۰۰۰ تومان/i)).toBeInTheDocument();
    expect(screen.getAllByText(/۳۹۰,۰۰۰ تومان/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /تکمیل خرید و تسویه‌حساب/i })).toBeInTheDocument();
  });

  it('updates quantity and removes item via stepper buttons', () => {
    useCartStore.setState({
      isOpen: true,
      items: [
        {
          id: 'item-1',
          productId: 10,
          variantId: 20,
          name: 'کالباس پپرونی ۹۰٪',
          variantName: '۳۰۰ گرم اسلایس',
          priceToman: 195000,
          quantity: 1,
        },
      ],
    });

    render(<CartDrawer />);

    // Increase
    const incBtn = screen.getByRole('button', { name: /افزایش تعداد/i });
    fireEvent.click(incBtn);
    expect(useCartStore.getState().items[0].quantity).toBe(2);

    // Decrease back
    const decBtn = screen.getByRole('button', { name: /کاهش تعداد/i });
    fireEvent.click(decBtn);
    expect(useCartStore.getState().items[0].quantity).toBe(1);

    // Remove when qty is 1
    const removeBtn = screen.getByRole('button', { name: /حذف محصول/i });
    fireEvent.click(removeBtn);
    expect(useCartStore.getState().items.length).toBe(0);
  });

  it('closes cart and routes to /checkout when clicking checkout button', () => {
    useCartStore.setState({
      isOpen: true,
      items: [
        {
          id: 'item-1',
          productId: 10,
          variantId: 20,
          name: 'کالباس پپرونی ۹۰٪',
          variantName: '۳۰۰ گرم اسلایس',
          priceToman: 195000,
          quantity: 1,
        },
      ],
    });

    render(<CartDrawer />);

    const checkoutBtn = screen.getByRole('button', { name: /تکمیل خرید و تسویه‌حساب/i });
    fireEvent.click(checkoutBtn);

    expect(useCartStore.getState().isOpen).toBe(false);
    expect(mockPush).toHaveBeenCalledWith('/checkout');
  });

  it('closes drawer when clicking close button', () => {
    useCartStore.setState({ isOpen: true, items: [] });
    render(<CartDrawer />);

    const closeBtn = screen.getByRole('button', { name: /بستن سبد خرید/i });
    fireEvent.click(closeBtn);
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it('renders item with fixed 80x80px (w-20 h-20) thumbnail container and object-cover image', () => {
    useCartStore.setState({
      isOpen: true,
      items: [
        {
          id: 'item-1',
          productId: 10,
          variantId: 20,
          name: 'کالباس پپرونی ۹۰٪',
          variantName: '۳۰۰ گرم اسلایس',
          priceToman: 195000,
          quantity: 1,
          imageUrl: '/images/products/pepperoni.jpg',
        },
      ],
    });

    render(<CartDrawer />);

    const img = screen.getByRole('img', { name: 'کالباس پپرونی ۹۰٪' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveClass('object-cover');

    const container = img.closest('div');
    expect(container).toHaveClass('w-20');
    expect(container).toHaveClass('h-20');
    expect(container).toHaveClass('shrink-0');
    expect(container).not.toHaveClass('w-18');
    expect(container).not.toHaveClass('h-18');
  });

  it('falls back to placeholder image when image fails to load via onError', () => {
    useCartStore.setState({
      isOpen: true,
      items: [
        {
          id: 'item-1',
          productId: 10,
          variantId: 20,
          name: 'کالباس پپرونی ۹۰٪',
          variantName: '۳۰۰ گرم اسلایس',
          priceToman: 195000,
          quantity: 1,
          imageUrl: '/images/products/broken-image.jpg',
        },
      ],
    });

    render(<CartDrawer />);

    const img = screen.getByRole('img', { name: 'کالباس پپرونی ۹۰٪' });
    fireEvent.error(img);
    expect((img as HTMLImageElement).src).toContain('/images/products/placeholder-meat.svg');
  });

  it('renders fallback icon inside 80x80px container when imageUrl is missing', () => {
    useCartStore.setState({
      isOpen: true,
      items: [
        {
          id: 'item-1',
          productId: 10,
          variantId: 20,
          name: 'سوسیس فرانکفورتر',
          variantName: '۵۰۰ گرم',
          priceToman: 120000,
          quantity: 1,
        },
      ],
    });

    const { container } = render(<CartDrawer />);
    const thumbContainers = container.querySelectorAll('.w-20.h-20');
    expect(thumbContainers.length).toBe(1);
  });
});
