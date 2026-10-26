import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as navigation from 'next/navigation';
import SearchPage from './page';
import { useCartStore } from '@/lib/cartStore';

describe('SearchPage & Catalog Listing', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      isOpen: false,
    });
    vi.restoreAllMocks();
  });

  it('renders search query heading with the search term and results count', async () => {
    vi.spyOn(navigation, 'useSearchParams').mockReturnValue(
      new URLSearchParams('q=سوسیس')
    );

    render(<SearchPage searchParams={Promise.resolve({ q: 'سوسیس' })} />);

    await waitFor(() => {
      expect(screen.getByText(/نتایج جستجو برای:/i)).toBeInTheDocument();
      expect(screen.getByText(/«سوسیس»/i)).toBeInTheDocument();
    });
  });

  it('displays product cards with brand, portion label, price and discount badge', async () => {
    vi.spyOn(navigation, 'useSearchParams').mockReturnValue(
      new URLSearchParams('q=سوسیس')
    );

    render(<SearchPage searchParams={Promise.resolve({ q: 'سوسیس' })} />);

    await waitFor(() => {
      // Look for sausage product card
      expect(screen.getByText(/سوسیس کوکتل پنیر آندره/i)).toBeInTheDocument();
      expect(screen.getAllByText(/۵۰۰ گرم/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/آندره/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/تومان/i).length).toBeGreaterThan(0);
    });
  });

  it('adds product to cart when clicking quick "افزودن به سبد" button', async () => {
    vi.spyOn(navigation, 'useSearchParams').mockReturnValue(
      new URLSearchParams('q=سوسیس')
    );

    render(<SearchPage searchParams={Promise.resolve({ q: 'سوسیس' })} />);

    await waitFor(() => {
      expect(screen.getByText(/سوسیس کوکتل پنیر آندره/i)).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /افزودن به سبد/i });
    expect(addButtons.length).toBeGreaterThan(0);

    fireEvent.click(addButtons[0]);

    expect(useCartStore.getState().getTotalItems()).toBeGreaterThan(0);
  });

  it('filters products when toggling "فقط کالاهای موجود"', async () => {
    vi.spyOn(navigation, 'useSearchParams').mockReturnValue(
      new URLSearchParams('q=')
    );

    render(<SearchPage searchParams={Promise.resolve({ q: '' })} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/فقط کالاهای موجود/i)).toBeInTheDocument();
    });

    const inStockToggle = screen.getByLabelText(/فقط کالاهای موجود/i);
    fireEvent.click(inStockToggle);

    // After filtering in-stock only, out of stock items should not be displayed
    await waitFor(() => {
      expect(screen.queryByText(/ناموجود/i)).not.toBeInTheDocument();
    });
  });

  it('filters products when toggling "فقط تخفیف‌دار"', async () => {
    vi.spyOn(navigation, 'useSearchParams').mockReturnValue(
      new URLSearchParams('q=')
    );

    render(<SearchPage searchParams={Promise.resolve({ q: '' })} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/فقط تخفیف‌دار/i)).toBeInTheDocument();
    });

    const onSaleToggle = screen.getByLabelText(/فقط تخفیف‌دار/i);
    fireEvent.click(onSaleToggle);

    await waitFor(() => {
      // Products with discounts should be displayed
      expect(screen.getByText(/ژامبون بوقلمون ۹۰٪ آندره/i)).toBeInTheDocument();
    });
  });

  it('changes sort order with SortDropdown', async () => {
    vi.spyOn(navigation, 'useSearchParams').mockReturnValue(
      new URLSearchParams('q=')
    );

    render(<SearchPage searchParams={Promise.resolve({ q: '' })} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /مرتب‌سازی/i })).toBeInTheDocument();
    });

    const sortSelect = screen.getByRole('combobox', { name: /مرتب‌سازی/i });
    fireEvent.change(sortSelect, { target: { value: 'price_asc' } });

    expect(sortSelect).toHaveValue('price_asc');
  });

  it('displays empty state when no products match search query', async () => {
    vi.spyOn(navigation, 'useSearchParams').mockReturnValue(
      new URLSearchParams('q=محصول_ناموجود_تست_۱۲۳۴۵')
    );

    render(
      <SearchPage
        searchParams={Promise.resolve({ q: 'محصول_ناموجود_تست_۱۲۳۴۵' })}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/هیچ محصولی مطابق با جستجوی شما یافت نشد/i)
      ).toBeInTheDocument();
    });
  });
});
