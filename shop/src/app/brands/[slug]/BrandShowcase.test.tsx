import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BrandShowcaseContent from './BrandShowcaseContent';
import BrandPage, { generateMetadata } from './page';
import * as serverCatalog from '@/lib/serverCatalog';
import type { BrandItem } from '@/lib/serverCatalog';
import type { ProductData as CatalogProduct } from '@/components/ProductCard';

const mockNotFound = vi.fn();
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<any>('next/navigation');
  return {
    ...actual,
    notFound: () => mockNotFound(),
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  };
});

const mockBrand: BrandItem = {
  id: 1,
  nameFa: 'کاله',
  nameEn: 'Kalleh',
  slug: 'kalleh',
  logoUrl: '/media/brands/kalleh.webp',
};

const mockProducts: CatalogProduct[] = [
  {
    id: 101,
    slug: 'kalleh-cheese-1',
    nameFa: 'پنیر موزارلا کاله',
    brandNameFa: 'کاله',
    priceToman: 95000,
    categoryId: 1,
    categoryNameFa: 'لبنیات و پنیر پیتزا',
    categorySlug: 'dairy-cheese',
    inStock: true,
    totalStock: 20,
  },
  {
    id: 102,
    slug: 'kalleh-sausage-2',
    nameFa: 'سوسیس شکاری کاله',
    brandNameFa: 'کاله',
    priceToman: 140000,
    categoryId: 2,
    categoryNameFa: 'سوسیس و هات‌داگ',
    categorySlug: 'sausage-hotdog',
    inStock: false,
    totalStock: 0,
  },
];

describe('BrandShowcaseContent Component', () => {
  it('renders breadcrumbs and brand header with logo, Persian name, and English badge', () => {
    render(
      <BrandShowcaseContent
        brand={mockBrand}
        initialProducts={mockProducts}
      />
    );

    // Breadcrumbs
    expect(screen.getByRole('link', { name: 'صفحه اصلی' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'برندها' })).toHaveAttribute('href', '/brands');

    // Brand Header
    const brandHeadings = screen.getAllByText('کاله');
    expect(brandHeadings.length).toBeGreaterThan(0);
    expect(screen.getByText('Kalleh')).toBeInTheDocument();

    // Logo image
    const logoImg = screen.getByAltText('کاله');
    expect(logoImg).toHaveAttribute('src', '/media/brands/kalleh.webp');

    // Product count
    expect(screen.getByText(/۲ محصول/)).toBeInTheDocument();
  });

  it('renders product cards for the brand', () => {
    render(
      <BrandShowcaseContent
        brand={mockBrand}
        initialProducts={mockProducts}
      />
    );

    expect(screen.getByText('پنیر موزارلا کاله')).toBeInTheDocument();
    expect(screen.getByText('سوسیس شکاری کاله')).toBeInTheDocument();
  });

  it('filters out of stock products when inStock filter is activated', () => {
    render(
      <BrandShowcaseContent
        brand={mockBrand}
        initialProducts={mockProducts}
      />
    );

    const inStockToggle = screen.getByRole('checkbox', { name: /فقط کالاهای موجود/i });
    fireEvent.click(inStockToggle);

    expect(screen.getByText('پنیر موزارلا کاله')).toBeInTheDocument();
    expect(screen.queryByText('سوسیس شکاری کاله')).not.toBeInTheDocument();
  });

  it('renders empty state when no products match', () => {
    render(
      <BrandShowcaseContent
        brand={mockBrand}
        initialProducts={[]}
      />
    );

    expect(screen.getByText(/محصولی برای این برند یافت نشد/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /مشاهده سایر برندها/i })).toHaveAttribute(
      'href',
      '/brands'
    );
  });

  describe('BrandPage server component & generateMetadata', () => {
    it('generateMetadata returns title and description for valid brand', async () => {
      vi.spyOn(serverCatalog, 'fetchBrandBySlug').mockResolvedValue(mockBrand);

      const meta = await generateMetadata({
        params: Promise.resolve({ slug: 'kalleh' }),
      });

      expect(meta.title).toContain('کاله');
      expect(meta.title).toContain('Kalleh');
      expect(meta.description).toContain('کاله');
    });

    it('generateMetadata handles missing brand', async () => {
      vi.spyOn(serverCatalog, 'fetchBrandBySlug').mockResolvedValue(null);

      const meta = await generateMetadata({
        params: Promise.resolve({ slug: 'unknown' }),
      });

      expect(meta.title).toContain('برند یافت نشد');
    });

    it('BrandPage calls notFound when brand does not exist', async () => {
      vi.spyOn(serverCatalog, 'fetchBrandBySlug').mockResolvedValue(null);
      vi.spyOn(serverCatalog, 'fetchCategories').mockResolvedValue([]);

      await BrandPage({
        params: Promise.resolve({ slug: 'unknown-slug' }),
      });

      expect(mockNotFound).toHaveBeenCalled();
    });

    it('BrandPage renders BrandShowcaseContent when brand is found', async () => {
      vi.spyOn(serverCatalog, 'fetchBrandBySlug').mockResolvedValue(mockBrand);
      vi.spyOn(serverCatalog, 'fetchCategories').mockResolvedValue([]);
      vi.spyOn(serverCatalog, 'fetchCatalogProducts').mockResolvedValue({
        content: mockProducts,
        totalElements: 2,
        totalPages: 1,
        page: 0,
        size: 48,
      });

      const element = await BrandPage({
        params: Promise.resolve({ slug: 'kalleh' }),
      });

      render(element);
      expect(screen.getByText('پنیر موزارلا کاله')).toBeInTheDocument();
    });
  });
});
