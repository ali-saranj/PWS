import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoryPage from './page';
import { useCartStore } from '@/lib/cartStore';

describe('CategoryPage', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      isOpen: false,
    });
    vi.restoreAllMocks();
  });

  it('renders category header with title and icon', async () => {
    render(<CategoryPage params={Promise.resolve({ slug: 'sausage-hotdog' })} />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /سوسیس و هات‌داگ/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/تضمین تازگی و کیفیت درجه یک سبد سبز/i)).toBeInTheDocument();
    });
  });

  it('displays products belonging to the selected category', async () => {
    render(<CategoryPage params={Promise.resolve({ slug: 'sausage-hotdog' })} />);

    await waitFor(() => {
      expect(screen.getByText(/سوسیس کوکتل پنیر آندره/i)).toBeInTheDocument();
      expect(screen.getByText(/سوسیس فرانکفورتر ۲۰۲/i)).toBeInTheDocument();
    });
  });

  it('allows sorting products on category page', async () => {
    render(<CategoryPage params={Promise.resolve({ slug: 'sausage-hotdog' })} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /مرتب‌سازی/i })).toBeInTheDocument();
    });

    const sortSelect = screen.getByRole('combobox', { name: /مرتب‌سازی/i });
    fireEvent.change(sortSelect, { target: { value: 'price_desc' } });

    expect(sortSelect).toHaveValue('price_desc');
  });

  it('adds category product to cart', async () => {
    render(<CategoryPage params={Promise.resolve({ slug: 'sausage-hotdog' })} />);

    await waitFor(() => {
      expect(screen.getByText(/سوسیس کوکتل پنیر آندره/i)).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /افزودن به سبد/i });
    expect(addButtons.length).toBeGreaterThan(0);

    fireEvent.click(addButtons[0]);

    expect(useCartStore.getState().getTotalItems()).toBeGreaterThan(0);
  });
});
