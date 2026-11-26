import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductsPage, { generateMetadata } from './page';
import * as serverCatalog from '@/lib/serverCatalog';

vi.mock('@/lib/serverCatalog', () => ({
  fetchCatalogProducts: vi.fn(),
  fetchCategories: vi.fn(),
  fetchBrands: vi.fn(),
  fetchCategoryBySlug: vi.fn(),
  fetchBrandBySlug: vi.fn(),
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

  describe('generateMetadata', () => {
    it('returns default catalog metadata and canonical for unfiltered products', async () => {
      const meta = await generateMetadata({ searchParams: Promise.resolve({}) });
      expect(meta.title).toContain('همه محصولات');
      expect(meta.alternates?.canonical).toBe('https://proteinirany.ir/products');
    });

    it('returns category title and canonical when categorySlug is present', async () => {
      vi.mocked(serverCatalog.fetchCategoryBySlug).mockResolvedValue({
        id: 2,
        slug: 'sausages',
        nameFa: 'سوسیس و هات‌داگ',
      } as any);

      const meta = await generateMetadata({
        searchParams: Promise.resolve({ categorySlug: 'sausages' }),
      });
      expect(meta.title).toContain('سوسیس و هات‌داگ');
      expect(meta.alternates?.canonical).toBe(
        'https://proteinirany.ir/products?categorySlug=sausages'
      );
    });

    it('returns brand title and canonical when brandSlug is present', async () => {
      vi.mocked(serverCatalog.fetchBrandBySlug).mockResolvedValue({
        id: 10,
        slug: 'andre',
        nameFa: 'آندره',
      } as any);

      const meta = await generateMetadata({
        searchParams: Promise.resolve({ brandSlug: 'andre' }),
      });
      expect(meta.title).toContain('آندره');
      expect(meta.alternates?.canonical).toBe(
        'https://proteinirany.ir/products?brandSlug=andre'
      );
    });

    it('preserves page query parameter in canonical when page > 0', async () => {
      const meta = await generateMetadata({
        searchParams: Promise.resolve({ page: '2' }),
      });
      expect(meta.alternates?.canonical).toBe('https://proteinirany.ir/products?page=2');
    });

    it('preserves page query parameter in canonical for filtered category when page > 0', async () => {
      vi.mocked(serverCatalog.fetchCategoryBySlug).mockResolvedValue({
        id: 2,
        slug: 'sausages',
        nameFa: 'سوسیس و هات‌داگ',
      } as any);

      const meta = await generateMetadata({
        searchParams: Promise.resolve({ categorySlug: 'sausages', page: '3' }),
      });
      expect(meta.alternates?.canonical).toBe(
        'https://proteinirany.ir/products?categorySlug=sausages&page=3'
      );
    });
  });

  describe('Semantic H1 Headings', () => {
    it('renders default semantic h1 heading for unfiltered catalog', async () => {
      vi.mocked(serverCatalog.fetchCatalogProducts).mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 0,
        page: 0,
        size: 24,
      });
      vi.mocked(serverCatalog.fetchCategories).mockResolvedValue([]);
      vi.mocked(serverCatalog.fetchBrands).mockResolvedValue([]);

      const jsx = await ProductsPage({ searchParams: Promise.resolve({}) });
      render(jsx);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('همه محصولات و فرآورده‌های پروتئینی');
    });

    it('renders category-specific semantic h1 heading when category is selected', async () => {
      vi.mocked(serverCatalog.fetchCatalogProducts).mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 0,
        page: 0,
        size: 24,
      });
      vi.mocked(serverCatalog.fetchCategories).mockResolvedValue([
        { id: 5, nameFa: 'خیارشور و ترشیجات', slug: 'pickles' },
      ]);
      vi.mocked(serverCatalog.fetchBrands).mockResolvedValue([]);

      const jsx = await ProductsPage({
        searchParams: Promise.resolve({ categorySlug: 'pickles' }),
      });
      render(jsx);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('خرید آنلاین انواع خیارشور و ترشیجات');
    });

    it('uses custom category seoTitle, seoDescription, seoH1, and renders seoContentFa when configured', async () => {
      vi.mocked(serverCatalog.fetchCategoryBySlug).mockResolvedValue({
        id: 5,
        nameFa: 'خیارشور و ترشیجات',
        slug: 'pickles',
        seoTitle: 'خرید خیارشور ممتاز در اصفهان',
        seoDescription: 'توضیحات سئو خیارشور',
        seoH1: 'خرید خیارشور ممتاز و ویژه ترد',
        seoContentFa: 'خط اول معرفی خیارشور\nخط دوم معرفی خیارشور',
        breadcrumbs: [],
        subcategories: [],
      });
      vi.mocked(serverCatalog.fetchCatalogProducts).mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 0,
        page: 0,
        size: 24,
      });
      vi.mocked(serverCatalog.fetchCategories).mockResolvedValue([
        {
          id: 5,
          nameFa: 'خیارشور و ترشیجات',
          slug: 'pickles',
          seoTitle: 'خرید خیارشور ممتاز در اصفهان',
          seoDescription: 'توضیحات سئو خیارشور',
          seoH1: 'خرید خیارشور ممتاز و ویژه ترد',
          seoContentFa: 'خط اول معرفی خیارشور\nخط دوم معرفی خیارشور',
        },
      ]);
      vi.mocked(serverCatalog.fetchBrands).mockResolvedValue([]);

      const meta = await generateMetadata({
        searchParams: Promise.resolve({ categorySlug: 'pickles' }),
      });
      expect(meta.title).toBe('خرید خیارشور ممتاز در اصفهان');
      expect(meta.description).toBe('توضیحات سئو خیارشور');

      const jsx = await ProductsPage({
        searchParams: Promise.resolve({ categorySlug: 'pickles' }),
      });
      render(jsx);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('خرید خیارشور ممتاز و ویژه ترد');
      expect(screen.getByText('خط اول معرفی خیارشور')).toBeInTheDocument();
      expect(screen.getByText('خط دوم معرفی خیارشور')).toBeInTheDocument();
    });

    it('uses custom brand seoTitle, seoDescription, seoH1, and renders seoContentFa when configured', async () => {
      vi.mocked(serverCatalog.fetchBrandBySlug).mockResolvedValue({
        id: 9,
        nameFa: 'سروش',
        slug: 'soroush',
        seoTitle: 'خرید محصولات برند سروش',
        seoDescription: 'توضیحات سئو برند سروش',
        seoH1: 'محصولات سوسیس و کالباس سروش',
        seoContentFa: 'معرفی کامل برند سروش',
      });
      vi.mocked(serverCatalog.fetchCatalogProducts).mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 0,
        page: 0,
        size: 24,
      });
      vi.mocked(serverCatalog.fetchCategories).mockResolvedValue([]);
      vi.mocked(serverCatalog.fetchBrands).mockResolvedValue([
        {
          id: 9,
          nameFa: 'سروش',
          slug: 'soroush',
          seoTitle: 'خرید محصولات برند سروش',
          seoDescription: 'توضیحات سئو برند سروش',
          seoH1: 'محصولات سوسیس و کالباس سروش',
          seoContentFa: 'معرفی کامل برند سروش',
        },
      ]);

      const meta = await generateMetadata({
        searchParams: Promise.resolve({ brandSlug: 'soroush' }),
      });
      expect(meta.title).toBe('خرید محصولات برند سروش');
      expect(meta.description).toBe('توضیحات سئو برند سروش');

      const jsx = await ProductsPage({
        searchParams: Promise.resolve({ brandSlug: 'soroush' }),
      });
      render(jsx);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('محصولات سوسیس و کالباس سروش');
      expect(screen.getByText('معرفی کامل برند سروش')).toBeInTheDocument();
    });

    it('preserves categorySlug in pagination links instead of rewriting to categoryId', async () => {
      vi.mocked(serverCatalog.fetchCategoryBySlug).mockResolvedValue({
        id: 1,
        nameFa: 'خیارشور',
        slug: 'pickles',
        breadcrumbs: [],
        subcategories: [],
      });
      vi.mocked(serverCatalog.fetchCatalogProducts).mockResolvedValue({
        content: [
          {
            id: 1,
            slug: 'pws-pkl-001',
            nameFa: 'خیارشور دبه ممتاز نمکی',
            brandId: 1,
            brandNameFa: 'رهنمود',
            categoryId: 1,
            categoryNameFa: 'خیارشور',
            basePriceRials: 14900000,
            priceToman: 1490000,
            inStock: true,
            totalStock: 50,
            badges: [],
          },
        ],
        totalElements: 48,
        totalPages: 2,
        page: 0,
        size: 24,
      });
      vi.mocked(serverCatalog.fetchCategories).mockResolvedValue([
        { id: 1, nameFa: 'خیارشور', slug: 'pickles' },
      ]);
      vi.mocked(serverCatalog.fetchBrands).mockResolvedValue([]);

      const jsx = await ProductsPage({
        searchParams: Promise.resolve({ categorySlug: 'pickles' }),
      });
      render(jsx);

      const page2Link = screen.getByRole('link', { name: /۲/ });
      const href = page2Link.getAttribute('href') || '';
      expect(href).toContain('categorySlug=pickles');
      expect(href).not.toContain('categoryId=');
    });
  });
});
