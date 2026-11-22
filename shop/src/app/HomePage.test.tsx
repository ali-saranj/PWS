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
      screen.getByText(/دهکده پروتئین اصفهان \/ مرجع تخصصی سوسیس، کالباس و مزه‌های اصیل/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/عرضه مستقیم تازه‌ترین سوسیس و ژامبون ممتاز، انواع پنیر پیتزا و گودا، سس‌های خاص، ترشیجات و خیارشور ترد با ارسال سریع در اصفهان/)
    ).toBeInTheDocument();
    expect(screen.getByText(/تخفیف‌های ویژه تا ۵۰٪/)).toBeInTheDocument();
    const ctaLink = screen.getByRole('link', { name: /خرید محصولات/i });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute('href', '/products');
  });

  it('renders all category circles with proper labels and links to /products', () => {
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

    const allCategoriesLink = screen.getByRole('link', { name: /مشاهده تمام دسته‌ها/i });
    expect(allCategoriesLink).toHaveAttribute('href', '/products');

    const sausageCircleLink = screen.getByRole('link', { name: /سوسیس و هات‌داگ/i });
    expect(sausageCircleLink).toHaveAttribute('href', '/products?categoryId=1');
  });

  it('renders promotional tiles with titles, discount badges, and links to /products', () => {
    render(<HomePage />);
    expect(screen.getByText(/سوسیس، هات‌داگ و ژامبون ممتاز/)).toBeInTheDocument();
    expect(screen.getByText(/انواع پنیر پیتزا، گودا و ورقه‌ای/)).toBeInTheDocument();
    expect(screen.getByText(/سس‌های خاص، خیارشور و ترشیجات/)).toBeInTheDocument();

    const promoLinks = screen.getAllByRole('link', { name: /(مشاهده و خرید|مشاهده پنیرها|خرید مزه‌جات)/i });
    expect(promoLinks[0]).toHaveAttribute('href', '/products?categorySlug=sausage-hotdog');
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
