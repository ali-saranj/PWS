import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchCatalogProducts,
  fetchProductBySlug,
  fetchCatalogSearch,
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
});
