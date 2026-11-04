import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchCatalogProducts,
  fetchProductBySlug,
  fetchCatalogSearch,
  fetchBrands,
  fetchBrandBySlug,
  BrandItem,
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
});
