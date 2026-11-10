import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductsPage from './page';
import * as serverCatalog from '@/lib/serverCatalog';

vi.mock('@/lib/serverCatalog', () => ({
  fetchCatalogProducts: vi.fn(),
  fetchCategories: vi.fn(),
  fetchBrands: vi.fn(),
}));

describe('ProductsPage Server Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(serverCatalog.fetchBrands).mockResolvedValue([]);
  });

  it('fetches products with converted price and renders product cards and pagination', async () => {
    vi.mocked(serverCatalog.fetchCatalogProducts).mockResolvedValue({
      content: [
        {
          id: 1,
          slug: 'turkey-ham-90',
          nameFa: 'ژامبون بوقلمون ۹۰٪ آندره',
          brandNameFa: 'آندره',
          brandId: 10,
          categoryId: 2,
          categoryNameFa: 'ژامبون',
          priceToman: 285000,
          basePriceRials: 2850000,
          inStock: true,
          totalStock: 50,
          badges: ['پرفروش'],
          defaultVariantId: 101,
        },
      ],
      totalElements: 25,
      totalPages: 2,
      page: 0,
      size: 24,
    });

    vi.mocked(serverCatalog.fetchCategories).mockResolvedValue([
      { id: 2, nameFa: 'ژامبون و بیکن', slug: 'ham-bacon' },
    ]);

    const searchParamsPromise = Promise.resolve({
      categoryId: '2',
      minPrice: '100000',
      sort: 'price_asc',
      page: '0',
    });

    const jsx = await ProductsPage({ searchParams: searchParamsPromise });
    render(jsx);

    expect(serverCatalog.fetchCatalogProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 2,
        minPriceRials: 1000000, // 100,000 Toman * 10 = 1,000,000 Rials
        sort: 'price_asc',
        page: 0,
        size: 24,
      })
    );

    expect(screen.getByText('ژامبون بوقلمون ۹۰٪ آندره')).toBeDefined();
    expect(screen.getAllByText('آندره').length).toBeGreaterThan(0);
    // Pagination should render page 2 link
    expect(screen.getByRole('link', { name: '۲' })).toBeDefined();
  });

  it('renders empty state message when no products match filters', async () => {
    vi.mocked(serverCatalog.fetchCatalogProducts).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: 24,
    });

    vi.mocked(serverCatalog.fetchCategories).mockResolvedValue([]);

    const searchParamsPromise = Promise.resolve({
      minPrice: '99999999',
    });

    const jsx = await ProductsPage({ searchParams: searchParamsPromise });
    render(jsx);

    expect(screen.getByText('کالایی با این فیلترها یافت نشد.')).toBeDefined();
  });

  it('reads inStock=true and brandId from searchParams and passes them to fetchCatalogProducts and pagination', async () => {
    vi.mocked(serverCatalog.fetchCatalogProducts).mockResolvedValue({
      content: [
        {
          id: 1,
          slug: 'turkey-ham-90',
          nameFa: 'ژامبون بوقلمون ۹۰٪ آندره',
          brandNameFa: 'آندره',
          brandId: 10,
          categoryId: 2,
          categoryNameFa: 'ژامبون',
          priceToman: 285000,
          basePriceRials: 2850000,
          inStock: true,
          totalStock: 50,
          badges: [],
          defaultVariantId: 101,
        },
      ],
      totalElements: 50,
      totalPages: 3,
      page: 0,
      size: 24,
    });
    vi.mocked(serverCatalog.fetchCategories).mockResolvedValue([]);
    vi.mocked(serverCatalog.fetchBrands).mockResolvedValue([
      { id: 10, nameFa: 'آندره', slug: 'andre' },
    ]);

    const searchParamsPromise = Promise.resolve({
      inStock: 'true',
      brandId: '10',
    });

    const jsx = await ProductsPage({ searchParams: searchParamsPromise });
    render(jsx);

    expect(serverCatalog.fetchCatalogProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        inStock: true,
        brandId: 10,
      })
    );
    expect(serverCatalog.fetchBrands).toHaveBeenCalled();

    const inStockCheckbox = screen.getByRole('checkbox', { name: 'فقط کالاهای موجود' }) as HTMLInputElement;
    expect(inStockCheckbox.checked).toBe(true);

    const brandCheckbox = screen.getByRole('checkbox', { name: 'آندره' }) as HTMLInputElement;
    expect(brandCheckbox.checked).toBe(true);

    const page2Link = screen.getByRole('link', { name: '۲' });
    expect(page2Link.getAttribute('href')).toContain('inStock=true');
    expect(page2Link.getAttribute('href')).toContain('brandId=10');
  });

  it('safely handles non-numeric categoryId slug without passing NaN to fetchCatalogProducts', async () => {
    vi.mocked(serverCatalog.fetchCatalogProducts).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: 24,
    });
    vi.mocked(serverCatalog.fetchCategories).mockResolvedValue([]);
    vi.mocked(serverCatalog.fetchBrands).mockResolvedValue([]);

    const searchParamsPromise = Promise.resolve({
      categoryId: 'protein',
    });

    const jsx = await ProductsPage({ searchParams: searchParamsPromise });
    render(jsx);

    expect(serverCatalog.fetchCatalogProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: undefined,
        categorySlug: 'protein',
      })
    );
  });

  it('resolves brandSlug and categorySlug to IDs so FilterSidebar displays them as active', async () => {
    vi.mocked(serverCatalog.fetchCatalogProducts).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: 24,
    });
    vi.mocked(serverCatalog.fetchCategories).mockResolvedValue([
      { id: 2, nameFa: 'ژامبون و بیکن', slug: 'ham-bacon' },
    ]);
    vi.mocked(serverCatalog.fetchBrands).mockResolvedValue([
      { id: 10, nameFa: 'آندره', slug: 'andre' },
    ]);

    const searchParamsPromise = Promise.resolve({
      brandSlug: 'andre',
      categorySlug: 'ham-bacon',
    });

    const jsx = await ProductsPage({ searchParams: searchParamsPromise });
    render(jsx);

    const brandCheckbox = screen.getByRole('checkbox', { name: 'آندره' }) as HTMLInputElement;
    expect(brandCheckbox.checked).toBe(true);

    const categoryButton = screen.getByRole('button', { name: /ژامبون و بیکن/i });
    expect(categoryButton.className).toContain('bg-primary');
  });
});
