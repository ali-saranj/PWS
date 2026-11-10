import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CategoryPage from './page';
import * as serverCatalog from '@/lib/serverCatalog';
import * as navigation from 'next/navigation';

const mockPush = vi.fn();
const mockPermanentRedirect = vi.fn();
const mockNotFound = vi.fn();

vi.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  permanentRedirect: (url: string) => mockPermanentRedirect(url),
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => '/category/sausage-hotdog',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/serverCatalog', () => ({
  fetchCategoryBySlug: vi.fn(),
  fetchCatalogProducts: vi.fn(),
  fetchBrands: vi.fn(),
  fetchCategories: vi.fn(),
}));

describe('CategoryPage Redirect', () => {
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

  beforeEach(() => {
    vi.restoreAllMocks();
    mockPermanentRedirect.mockClear();
    mockNotFound.mockClear();
  });

  it('redirects with HTTP 308 to /products?categorySlug={slug} when category exists', async () => {
    vi.mocked(serverCatalog.fetchCategoryBySlug).mockResolvedValue(mockCategory);

    await CategoryPage({
      params: Promise.resolve({ slug: 'sausage-hotdog' }),
    });

    expect(serverCatalog.fetchCategoryBySlug).toHaveBeenCalledWith('sausage-hotdog');
    expect(mockPermanentRedirect).toHaveBeenCalledWith('/products?categorySlug=sausage-hotdog');
  });

  it('calls notFound when category does not exist', async () => {
    vi.mocked(serverCatalog.fetchCategoryBySlug).mockResolvedValue(null);

    await CategoryPage({
      params: Promise.resolve({ slug: 'non-existent' }),
    });

    expect(serverCatalog.fetchCategoryBySlug).toHaveBeenCalledWith('non-existent');
    expect(mockNotFound).toHaveBeenCalledTimes(1);
    expect(mockPermanentRedirect).not.toHaveBeenCalled();
  });
});
