'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FilterSidebar, FilterState } from '@/components/FilterSidebar';
import { SortDropdown, SortOptionKey } from '@/components/SortDropdown';
import { CategoryItem } from '@/lib/serverCatalog';

interface CatalogFiltersProps {
  categories?: CategoryItem[];
  availableBrands?: string[];
  initialFilters: FilterState;
  initialSort: SortOptionKey;
  totalElements?: number;
  hideSidebar?: boolean;
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  categories,
  availableBrands,
  initialFilters,
  initialSort,
  totalElements,
  hideSidebar = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateUrlParams = (newFilters: FilterState, newSort?: SortOptionKey) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset to page 0 on filter change
    params.delete('page');

    if (newFilters.categoryId) {
      params.set('categoryId', String(newFilters.categoryId));
    } else {
      params.delete('categoryId');
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

    if (newFilters.minPrice !== undefined && newFilters.minPrice !== null) {
      params.set('minPrice', String(newFilters.minPrice));
    } else {
      params.delete('minPrice');
    }

    if (newFilters.maxPrice !== undefined && newFilters.maxPrice !== null) {
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

  return (
    <>
      {!hideSidebar && (
        <aside className="w-full md:w-64 flex-shrink-0">
          <FilterSidebar
            categories={categories as any}
            availableBrands={availableBrands}
            values={initialFilters}
            onChange={handleFilterChange}
            onReset={handleReset}
          />
        </aside>
      )}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            محصولات پروتئینی و سوپرمارکتی
          </h1>
          {totalElements !== undefined && (
            <span className="text-xs sm:text-sm text-gray-500">
              نمایش {totalElements} کالا {isPending && '...'}
            </span>
          )}
        </div>
        <SortDropdown value={initialSort} onChange={handleSortChange} />
      </div>
    </>
  );
};

export default CatalogFilters;
