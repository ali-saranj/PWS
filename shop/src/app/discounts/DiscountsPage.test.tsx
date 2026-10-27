import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DiscountsPage from './page';
import * as serverCatalog from '@/lib/serverCatalog';

vi.mock('@/lib/serverCatalog', () => ({
  fetchCatalogProducts: vi.fn(),
}));

describe('DiscountsPage Server Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries onSale=true products with 24 per page and renders promotional grid', async () => {
    vi.mocked(serverCatalog.fetchCatalogProducts).mockResolvedValue({
      content: [
        {
          id: 5,
          slug: 'special-frankfurter',
          nameFa: 'سوسیس فرانکفورتر تخفیف‌دار',
          brandNameFa: '۲۰۲',
          brandId: 12,
          categoryId: 3,
          categoryNameFa: 'سوسیس',
          priceToman: 195000,
          compareAtPriceToman: 250000,
          discountPercent: 22,
          basePriceRials: 1950000,
          inStock: true,
          totalStock: 30,
          badges: ['شگفت‌انگیز'],
          defaultVariantId: 501,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 24,
    });

    const jsx = await DiscountsPage({ searchParams: Promise.resolve({ page: '0' }) });
    render(jsx);

    expect(serverCatalog.fetchCatalogProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        onSale: true,
        page: 0,
        size: 24,
      })
    );

    expect(screen.getByText('سوسیس فرانکفورتر تخفیف‌دار')).toBeDefined();
    expect(screen.getByText('پیشنهادهای شگفت‌انگیز و تخفیف‌های ویژه')).toBeDefined();
  });
});
