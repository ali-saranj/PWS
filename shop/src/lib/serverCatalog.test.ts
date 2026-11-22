import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchCatalogProducts,
  fetchProductBySlug,
  fetchCatalogSearch,
  fetchBrands,
  fetchBrandBySlug,
  fetchCategories,
  fetchCategoryBySlug,
  fetchSitemapEntries,
  BrandItem,
  CategoryItem,
  CategoryDetail,
  resolveRelatedProducts,
} from './serverCatalog';

describe('serverCatalog API client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetchCatalogProducts serializes parameters and returns paged products', async () => {
    const mockResponse = {
      content: [
        {
          id: 1,
          slug: 'turkey-ham-90',
          nameFa: 'ژامبون بوقلمون ۹۰٪ آندره',
          priceToman: 285000,
          basePriceRials: 2850000,
          inStock: true,
          totalStock: 45,
          badges: ['ویژه'],
        },
      ],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 24,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchCatalogProducts({
      categoryId: 2,
      onSale: true,
      minPriceRials: 1000000,
      sort: 'price_asc',
      page: 1,
      size: 24,
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('/api/shop/catalog/products');
    expect(calledUrl).toContain('categoryId=2');
    expect(calledUrl).toContain('onSale=true');
    expect(calledUrl).toContain('minPrice=1000000');
    expect(calledUrl).toContain('sort=price_asc');
    expect(calledUrl).toContain('page=1');
    expect(calledUrl).toContain('size=24');
    expect(result.content[0].slug).toBe('turkey-ham-90');
    expect(result.totalElements).toBe(1);
  });

  it('fetchCatalogProducts normalizes Spring Boot PageResponse with items and total', async () => {
    const springBootResponse = {
      items: [
        {
          id: 4,
          slug: 'test',
          nameFa: 'تست',
          priceToman: 332,
          inStock: true,
        },
      ],
      page: 0,
      size: 20,
      total: 4,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => springBootResponse,
    } as Response);

    const result = await fetchCatalogProducts({});
    expect(result.content).toBeDefined();
    expect(result.content[0].slug).toBe('test');
    expect(result.totalElements).toBe(4);
    expect(result.totalPages).toBe(1);
  });

  it('fetchProductBySlug returns product detail on 200', async () => {
    const mockDetail = {
      id: 1,
      slug: 'turkey-ham-90',
      nameFa: 'ژامبون بوقلمون ۹۰٪ آندره',
      priceToman: 285000,
      basePriceRials: 2850000,
      inStock: true,
      totalStock: 45,
      variants: [
        {
          id: 101,
          sku: 'TUR-90-500',
          weightGrams: 500,
          priceToman: 285000,
          stockOnHand: 20,
          inStock: true,
          tiers: [],
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDetail,
    } as Response);

    const result = await fetchProductBySlug('turkey-ham-90');
    expect(result).not.toBeNull();
    expect(result?.nameFa).toBe('ژامبون بوقلمون ۹۰٪ آندره');
    expect(result?.variants).toHaveLength(1);
  });

  it('fetchProductBySlug returns null on 404', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    const result = await fetchProductBySlug('unknown-product');
    expect(result).toBeNull();
  });

  it('fetchCatalogSearch queries the search endpoint with term and pagination', async () => {
    const mockSearchResponse = {
      content: [
        {
          id: 2,
          slug: 'frankfurter-sausage',
          nameFa: 'سوسیس فرانکفورتر ۲۰۲',
          priceToman: 320000,
          inStock: true,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 24,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSearchResponse,
    } as Response);

    const result = await fetchCatalogSearch('سوسیس', 0, 24);
    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('/api/shop/catalog/search');
    expect(calledUrl).toContain('q=%D8%B3%D9%88%D8%B3%DB%8C%D8%B3');
    expect(calledUrl).toContain('size=24');
    expect(result.content[0].slug).toBe('frankfurter-sausage');
  });

  it('fetchCatalogProducts guards against NaN for numeric parameters and never serializes NaN', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ content: [], totalElements: 0 }),
    } as Response);

    await fetchCatalogProducts({
      categoryId: NaN,
      brandId: NaN,
      minPriceRials: NaN,
      maxPriceRials: NaN,
      page: NaN,
      size: NaN,
    } as any);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).not.toContain('NaN');
    expect(calledUrl).not.toContain('categoryId');
    expect(calledUrl).not.toContain('brandId');
    expect(calledUrl).not.toContain('minPrice');
    expect(calledUrl).not.toContain('maxPrice');
  });

  it('fetchCatalogProducts serializes inStock, categorySlug, brandSlug, and brandIds', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ content: [], totalElements: 0 }),
    } as Response);

    await fetchCatalogProducts({
      inStock: true,
      categorySlug: 'sausages',
      brandSlug: 'andre',
      brandIds: [10, 20],
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('inStock=true');
    expect(calledUrl).toContain('categorySlug=sausages');
    expect(calledUrl).toContain('brandSlug=andre');
    expect(calledUrl).toContain('brandIds=10%2C20');
  });

  it('fetchBrands fetches brands from /api/shop/catalog/brands', async () => {
    const mockBrands: BrandItem[] = [
      { id: 1, nameFa: 'آندره', nameEn: 'Andre', slug: 'andre' },
      { id: 2, nameFa: '۲۰۲', nameEn: '202', slug: '202' },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockBrands,
    } as Response);

    const brands = await fetchBrands();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('/api/shop/catalog/brands');
    expect(brands).toHaveLength(2);
    expect(brands[0].nameFa).toBe('آندره');
    expect(brands[1].slug).toBe('202');
  });

  it('fetchBrands returns empty array on failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const brands = await fetchBrands();
    expect(brands).toEqual([]);
  });

  it('fetchBrandBySlug fetches single brand from /api/shop/catalog/brands/:slug', async () => {
    const mockBrand: BrandItem = {
      id: 1,
      nameFa: 'کاله',
      nameEn: 'Kalleh',
      slug: 'kalleh',
      logoUrl: '/media/brands/kalleh.webp',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockBrand,
    } as Response);

    const brand = await fetchBrandBySlug('kalleh');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('/api/shop/catalog/brands/kalleh');
    expect(brand).toEqual(mockBrand);
    expect(brand?.logoUrl).toBe('/media/brands/kalleh.webp');
  });

  it('fetchBrandBySlug returns null on 404 or failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    const brand = await fetchBrandBySlug('non-existent');
    expect(brand).toBeNull();

    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const brandError = await fetchBrandBySlug('kalleh');
    expect(brandError).toBeNull();
  });

  it('fetchCategories calls /api/shop/catalog/categories and returns categories', async () => {
    const mockCategories: CategoryItem[] = [
      { id: 1, nameFa: 'سوسیس', nameEn: 'Sausage', slug: 'sausages' },
      { id: 2, nameFa: 'کالباس', nameEn: 'Cold Cuts', slug: 'cold-cuts', parentId: 1 },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockCategories,
    } as Response);

    const result = await fetchCategories();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('/api/shop/catalog/categories');
    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe('sausages');
  });

  it('fetchCategoryBySlug calls /api/shop/catalog/categories/:slug and returns detail or null', async () => {
    const mockDetail: CategoryDetail = {
      id: 2,
      nameFa: 'کالباس',
      nameEn: 'Cold Cuts',
      slug: 'cold-cuts',
      parentId: 1,
      breadcrumbs: [
        { id: 1, nameFa: 'سوسیس', slug: 'sausages' },
        { id: 2, nameFa: 'کالباس', slug: 'cold-cuts' },
      ],
      subcategories: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDetail,
    } as Response);

    const detail = await fetchCategoryBySlug('cold-cuts');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('/api/shop/catalog/categories/cold-cuts');
    expect(detail?.breadcrumbs).toHaveLength(2);

    // 404 test
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);
    const notFound = await fetchCategoryBySlug('invalid');
    expect(notFound).toBeNull();
  });

  it('fetchSitemapEntries aggregates products, categories, and brands with graceful fallback', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/shop/catalog/products')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            content: [{ slug: 'sausage-frankfurter' }],
          }),
        } as Response;
      }
      if (url.includes('/api/shop/catalog/categories')) {
        return {
          ok: true,
          status: 200,
          json: async () => [{ slug: 'sausages' }],
        } as Response;
      }
      if (url.includes('/api/shop/catalog/brands')) {
        return {
          ok: true,
          status: 200,
          json: async () => [{ slug: 'andre' }],
        } as Response;
      }
      return { ok: false, status: 500 } as Response;
    });

    const entries = await fetchSitemapEntries();
    expect(entries.products).toEqual([{ slug: 'sausage-frankfurter' }]);
    expect(entries.categories).toEqual([{ slug: 'sausages' }]);
    expect(entries.brands).toEqual([{ slug: 'andre' }]);
  });

  describe('resolveRelatedProducts', () => {
    it('ranks same-brand products first, excludes current product, and limits to 4', async () => {
      const current = {
        id: 10,
        slug: 'current-ham',
        categoryId: 2,
        brandId: 101,
        brandNameFa: 'آندره',
      };

      const candidates = [
        { id: 10, slug: 'current-ham', categoryId: 2, brandId: 101, nameFa: 'محصول جاری', priceToman: 100 },
        { id: 11, slug: 'other-brand-1', categoryId: 2, brandId: 999, nameFa: 'برند دیگر ۱', priceToman: 110 },
        { id: 12, slug: 'same-brand-1', categoryId: 2, brandId: 101, nameFa: 'همان برند ۱', priceToman: 120 },
        { id: 13, slug: 'other-brand-2', categoryId: 2, brandId: 888, nameFa: 'برند دیگر ۲', priceToman: 130 },
        { id: 14, slug: 'same-brand-2', categoryId: 2, brandId: 101, nameFa: 'همان برند ۲', priceToman: 140 },
        { id: 15, slug: 'other-brand-3', categoryId: 2, brandId: 777, nameFa: 'برند دیگر ۳', priceToman: 150 },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          content: candidates,
          totalElements: candidates.length,
        }),
      } as Response);

      const related = await resolveRelatedProducts(current);

      expect(related).toHaveLength(4);
      // Current product should NOT be in the results
      expect(related.some((p) => p.slug === 'current-ham')).toBe(false);
      // Same brand products (12, 14) must appear before different brands
      expect(related[0].id).toBe(12);
      expect(related[1].id).toBe(14);
      // Remaining 2 items from other brands
      expect(related[2].id).toBe(11);
      expect(related[3].id).toBe(13);
    });

    it('falls back to MOCK_CATALOG_PRODUCTS when API fails or returns empty', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const current = {
        id: 101,
        slug: 'andre-turkey-ham-90',
        categoryId: 2,
        brandId: 1,
        brandNameFa: 'آندره',
      };

      const related = await resolveRelatedProducts(current);

      expect(related.length).toBeGreaterThan(0);
      expect(related.length).toBeLessThanOrEqual(4);
      // Excludes current product
      expect(related.some((p) => p.slug === 'andre-turkey-ham-90')).toBe(false);
      // Does not contain dummy fake slugs like related-1
      expect(related.some((p) => p.slug.startsWith('related-'))).toBe(false);
    });
  });
});
