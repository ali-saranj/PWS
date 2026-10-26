import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HomePage from './page';
import { useCartStore } from '@/lib/cartStore';

describe('HomePage', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      isOpen: false,
    });
    // Reset global fetch mock if any
    vi.restoreAllMocks();
  });

  it('renders hero banner with headline, subtitle, discount pill and CTA', () => {
    render(<HomePage />);
    expect(
      screen.getByText(/تازه، سالم، باکیفیت \/ تأمین روزانه مواد غذایی با بهترین قیمت/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/میوه و سبزیجات تازه، لبنیات، پروتئین، نان و.../)
    ).toBeInTheDocument();
    expect(screen.getByText(/تخفیف‌های ویژه تا ۵۰٪/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /خرید محصولات/i })).toBeInTheDocument();
  });

  it('renders all category circles with proper labels', () => {
    render(<HomePage />);
    const expectedCategories = [
      'سوسیس و هات‌داگ',
      'کالباس و ژامبون',
      'خیارشور و ترشیجات',
      'سس و چاشنی',
      'نان ساندویچی',
      'چیپس و تنقلات',
      'کنسروجات',
      'لبنیات و پنیر',
    ];

    expectedCategories.forEach((cat) => {
      expect(screen.getByText(cat)).toBeInTheDocument();
    });
  });

  it('renders promotional tiles with titles and discount badges', () => {
    render(<HomePage />);
    expect(screen.getByText(/فروش ویژه سوسیس و ژامبون/)).toBeInTheDocument();
    expect(screen.getByText(/لبنیات تازه با تضمین کیفیت/)).toBeInTheDocument();
    expect(screen.getByText(/تنقلات و چیپس/)).toBeInTheDocument();
  });

  it('renders special offers carousel section with header and products', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { name: 'پیشنهادهای شگفت‌انگیز' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('مشاهده همه').length).toBeGreaterThan(0);
  });

  it('renders value badges including fast courier delivery banner', () => {
    render(<HomePage />);
    expect(
      screen.getByText(/تحویل سریع درب منزل با بسته‌بندی ایمن و استاندارد/)
    ).toBeInTheDocument();
  });

  it('renders popular products carousel section with star ratings and products', () => {
    render(<HomePage />);
    expect(screen.getByText('پرفروش‌ترین محصولات')).toBeInTheDocument();
  });

  it('increments cart count when clicking "افزودن به سبد"', () => {
    render(<HomePage />);
    expect(useCartStore.getState().getTotalItems()).toBe(0);

    const addButtons = screen.getAllByRole('button', { name: /افزودن به سبد/i });
    expect(addButtons.length).toBeGreaterThan(0);

    fireEvent.click(addButtons[0]);

    expect(useCartStore.getState().getTotalItems()).toBeGreaterThan(0);
  });
});
