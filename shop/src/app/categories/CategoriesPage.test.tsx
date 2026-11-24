import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CategoriesPage from './page';
import * as serverCatalog from '@/lib/serverCatalog';

vi.mock('@/lib/serverCatalog', () => ({
  fetchCategories: vi.fn(),
}));

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders root categories with subcategory links', async () => {
    const mockCategories: serverCatalog.CategoryItem[] = [
      { id: 1, nameFa: 'سوسیس و کالباس', slug: 'sausages-coldcuts', parentId: undefined, sortOrder: 1 },
      { id: 2, nameFa: 'سوسیس هات‌داگ', slug: 'hotdogs', parentId: 1, sortOrder: 1 },
      { id: 3, nameFa: 'ژامبون بوقلمون', slug: 'turkey-ham', parentId: 1, sortOrder: 2 },
      { id: 4, nameFa: 'لبنیات و پنیر', slug: 'dairy', parentId: undefined, sortOrder: 2 },
    ];

    vi.mocked(serverCatalog.fetchCategories).mockResolvedValue(mockCategories);

    const jsx = await CategoriesPage();
    render(jsx);

    expect(screen.getByText('دسته‌بندی‌های محصولات')).toBeInTheDocument();
    expect(screen.getByText('سوسیس و کالباس')).toBeInTheDocument();
    expect(screen.getByText('لبنیات و پنیر')).toBeInTheDocument();

    // Check subcategories are rendered
    expect(screen.getByText('سوسیس هات‌داگ')).toBeInTheDocument();
    expect(screen.getByText('ژامبون بوقلمون')).toBeInTheDocument();

    // Check link targets
    const hotdogLink = screen.getByRole('link', { name: /سوسیس هات‌داگ/i });
    expect(hotdogLink).toHaveAttribute('href', '/products?categorySlug=hotdogs');

    const rootLink = screen.getByRole('link', { name: /مشاهده همه محصولات سوسیس و کالباس/i });
    expect(rootLink).toHaveAttribute('href', '/products?categorySlug=sausages-coldcuts');
  });

  it('renders fallback empty state when no categories exist', async () => {
    vi.mocked(serverCatalog.fetchCategories).mockResolvedValue([]);

    const jsx = await CategoriesPage();
    render(jsx);

    expect(screen.getByText(/در حال حاضر دسته‌بندی فعالی وجود ندارد/i)).toBeInTheDocument();
  });

  it('exports explicit self-referential canonical metadata', async () => {
    const { metadata } = await import('./page');
    expect(metadata.alternates?.canonical).toBe('https://proteinirany.ir/categories');
  });
});
