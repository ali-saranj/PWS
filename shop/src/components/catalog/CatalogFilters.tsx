'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FilterSidebar, FilterState } from '@/components/FilterSidebar';
import { SortDropdown, SortOptionKey } from '@/components/SortDropdown';
import { CategoryItem, BrandItem } from '@/lib/serverCatalog';
import { toPersianDigits } from '@/lib/format';

interface CatalogFiltersProps {
  categories?: CategoryItem[];
  availableBrands?: (string | BrandItem)[];
  brands?: BrandItem[];
  initialFilters: FilterState;
  initialSort: SortOptionKey;
  totalElements?: number;
  hideSidebar?: boolean;
  title?: string;
  children?: React.ReactNode;
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  categories,
  availableBrands,
  brands,
  initialFilters,
  initialSort,
  totalElements,
  hideSidebar = false,
  title = 'محصولات پروتئینی و سوپرمارکتی',
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateUrlParams = (newFilters: FilterState, newSort?: SortOptionKey) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset to page 0 on filter change
    params.delete('page');

    if (newFilters.categoryId !== undefined && newFilters.categoryId !== null && newFilters.categoryId !== '') {
      params.set('categoryId', String(newFilters.categoryId));
    } else {
      params.delete('categoryId');
    }

    if (newFilters.brandId !== undefined && newFilters.brandId !== null && !Number.isNaN(Number(newFilters.brandId))) {
      params.set('brandId', String(newFilters.brandId));
    } else {
      params.delete('brandId');
    }

    if (newFilters.brands && newFilters.brands.length > 0) {
      params.delete('brands');
      newFilters.brands.forEach((b) => params.append('brands', b));
    } else {
      params.delete('brands');
    }

    if (newFilters.inStockOnly) {
      params.set('inStock', 'true');
    } else {
      params.delete('inStock');
    }

    if (newFilters.onSaleOnly) {
      params.set('onSale', 'true');
    } else {
      params.delete('onSale');
    }

    if (newFilters.minPrice !== undefined && newFilters.minPrice !== null && !Number.isNaN(Number(newFilters.minPrice))) {
      params.set('minPrice', String(newFilters.minPrice));
    } else {
      params.delete('minPrice');
    }

    if (newFilters.maxPrice !== undefined && newFilters.maxPrice !== null && !Number.isNaN(Number(newFilters.maxPrice))) {
      params.set('maxPrice', String(newFilters.maxPrice));
    } else {
      params.delete('maxPrice');
    }

    const sort = newSort !== undefined ? newSort : initialSort;
    if (sort && sort !== 'newest') {
      params.set('sort', sort);
    } else {
      params.delete('sort');
    }

    const qs = params.toString();
    startTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ''}`);
    });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    updateUrlParams(newFilters);
  };

  const handleSortChange = (newSort: SortOptionKey) => {
    updateUrlParams(initialFilters, newSort);
  };

  const handleReset = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  // Full-width Header Bar
  const headerContent = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-gray-200">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900">
          {title}
        </h1>
        {totalElements !== undefined && (
          <span className="text-xs sm:text-sm text-gray-500 font-medium">
            نمایش {toPersianDigits(totalElements)} کالا {isPending && '...'}
          </span>
        )}
      </div>
      <SortDropdown value={initialSort} onChange={handleSortChange} />
    </div>
  );

  const sidebarContent = !hideSidebar && (
    <aside className="w-full">
      <FilterSidebar
        categories={categories as any}
        availableBrands={brands || availableBrands}
        values={initialFilters}
        onChange={handleFilterChange}
        onReset={handleReset}
      />
    </aside>
  );

  // If children are passed, render complete structured grid layout
  if (children) {
    return (
      <div className="w-full">
        {headerContent}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-1">{sidebarContent}</div>
          <div className="lg:col-span-3">{children}</div>
        </div>
      </div>
    );
  }

  // Fallback layout if used without children
  return (
    <>
      {headerContent}
      {sidebarContent}
    </>
  );
};

export default CatalogFilters;
