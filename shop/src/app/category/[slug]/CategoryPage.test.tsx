import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoryPage from './page';
import { useCartStore } from '@/lib/cartStore';
import * as serverCatalog from '@/lib/serverCatalog';
import * as navigation from 'next/navigation';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/category/sausage-hotdog',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/serverCatalog', () => ({
  fetchCategoryBySlug: vi.fn(),
  fetchCatalogProducts: vi.fn(),
  fetchBrands: vi.fn(),
}));

describe('CategoryPage', () => {
  const mockCategory: serverCatalog.CategoryDetail = {
    id: 1,
    nameFa: 'سوسیس و هات‌داگ',
    nameEn: 'Sausages & Hot Dogs',
    slug: 'sausage-hotdog',
    breadcrumbs: [
      { id: 1, nameFa: 'سوسیس و هات‌داگ', slug: 'sausage-hotdog' },
    ],
    subcategories: [
      { id: 10, nameFa: 'هات‌داگ پنیری', slug: 'cheese-hotdog', parentId: 1 },
    ],
  };

  const mockProducts: serverCatalog.ProductSummary[] = [
    {
      id: 101,
      slug: 'andre-cocktail-cheese-sausage',
      nameFa: 'سوسیس کوکتل پنیر آندره',
      brandId: 1,
      brandNameFa: 'آندره',
      categoryId: 1,
      categoryNameFa: 'سوسیس و هات‌داگ',
      priceToman: 210000,
      basePriceRials: 2100000,
      inStock: true,
      totalStock: 25,
      badges: [],
    },
    {
      id: 102,
      slug: 'frankfurter-sausage-202',
      nameFa: 'سوسیس فرانکفورتر ۲۰۲',
      brandId: 2,
      brandNameFa: '۲۰۲',
      categoryId: 1,
      categoryNameFa: 'سوسیس و هات‌داگ',
      priceToman: 180000,
      basePriceRials: 1800000,
      inStock: true,
      totalStock: 30,
      badges: [],
    },
  ];

  beforeEach(() => {
    useCartStore.setState({
      items: [],
      isOpen: false,
    });
    vi.restoreAllMocks();
  });

  it('renders category header with title, subcategories and products', async () => {
    vi.mocked(serverCatalog.fetchCategoryBySlug).mockResolvedValue(mockCategory);
    vi.mocked(serverCatalog.fetchBrands).mockResolvedValue([]);
    vi.mocked(serverCatalog.fetchCatalogProducts).mockResolvedValue({
      content: mockProducts,
      totalElements: 2,
      totalPages: 1,
      page: 0,
      size: 48,
    });

    const jsx = await CategoryPage({
      params: Promise.resolve({ slug: 'sausage-hotdog' }),
    });
    render(jsx!);

    expect(
      screen.getByRole('heading', { name: /سوسیس و هات‌داگ/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/تضمین تازگی و کیفیت درجه یک سبد سبز/i)).toBeInTheDocument();

    // Check subcategory pill
    expect(screen.getByText('هات‌داگ پنیری')).toBeInTheDocument();

    // Check products
    expect(screen.getByText('سوسیس کوکتل پنیر آندره')).toBeInTheDocument();
    expect(screen.getByText('سوسیس فرانکفورتر ۲۰۲')).toBeInTheDocument();
  });

  it('allows sorting products on category page', async () => {
    vi.mocked(serverCatalog.fetchCategoryBySlug).mockResolvedValue(mockCategory);
    vi.mocked(serverCatalog.fetchBrands).mockResolvedValue([]);
    vi.mocked(serverCatalog.fetchCatalogProducts).mockResolvedValue({
      content: mockProducts,
      totalElements: 2,
      totalPages: 1,
      page: 0,
      size: 48,
    });

    const jsx = await CategoryPage({
      params: Promise.resolve({ slug: 'sausage-hotdog' }),
    });
    render(jsx!);

    const sortSelect = screen.getByRole('combobox', { name: /مرتب‌سازی/i });
    expect(sortSelect).toBeInTheDocument();

    fireEvent.change(sortSelect, { target: { value: 'price_desc' } });
    expect(sortSelect).toHaveValue('price_desc');
  });

  it('adds category product to cart', async () => {
    vi.mocked(serverCatalog.fetchCategoryBySlug).mockResolvedValue(mockCategory);
    vi.mocked(serverCatalog.fetchBrands).mockResolvedValue([]);
    vi.mocked(serverCatalog.fetchCatalogProducts).mockResolvedValue({
      content: mockProducts,
      totalElements: 2,
      totalPages: 1,
      page: 0,
      size: 48,
    });

    const jsx = await CategoryPage({
      params: Promise.resolve({ slug: 'sausage-hotdog' }),
    });
    render(jsx!);

    const addButtons = screen.getAllByRole('button', { name: /افزودن به سبد/i });
    expect(addButtons.length).toBeGreaterThan(0);

    fireEvent.click(addButtons[0]);
    expect(useCartStore.getState().getTotalItems()).toBeGreaterThan(0);
  });

  it('calls notFound when category does not exist', async () => {
    vi.mocked(serverCatalog.fetchCategoryBySlug).mockResolvedValue(null);
    vi.mocked(serverCatalog.fetchBrands).mockResolvedValue([]);

    await CategoryPage({
      params: Promise.resolve({ slug: 'non-existent' }),
    });

    expect(navigation.notFound).toHaveBeenCalledTimes(1);
  });
});
