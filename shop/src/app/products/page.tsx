'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { FilterSidebar, FilterState } from '@/components/FilterSidebar';
import { SortDropdown, SortOptionKey } from '@/components/SortDropdown';
import { MOCK_CATALOG_PRODUCTS } from '@/lib/mockProducts';

export default function ProductsPage() {
  const [filters, setFilters] = useState<FilterState>({
    categoryId: null,
    brands: [],
    inStockOnly: false,
    onSaleOnly: false,
    minPrice: null,
    maxPrice: null,
  });
  const [sortOption, setSortOption] = useState<SortOptionKey>('newest');

  let list = [...MOCK_CATALOG_PRODUCTS];

  if (filters.brands.length > 0) {
    list = list.filter((p) => p.brandNameFa && filters.brands.includes(p.brandNameFa));
  }
  if (filters.inStockOnly) {
    list = list.filter((p) => p.inStock);
  }
  if (filters.onSaleOnly) {
    list = list.filter((p) => (p.discountPercent ?? 0) > 0);
  }
  if (filters.minPrice !== null && filters.minPrice !== undefined) {
    list = list.filter((p) => p.priceToman >= filters.minPrice!);
  }
  if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
    list = list.filter((p) => p.priceToman <= filters.maxPrice!);
  }

  const sortedProducts = list.sort((a, b) => {
    if (sortOption === 'price_asc') return a.priceToman - b.priceToman;
    if (sortOption === 'price_desc') return b.priceToman - a.priceToman;
    if (sortOption === 'popular') return (b.rating ?? 0) - (a.rating ?? 0);
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-vazirmatn">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          صفحه اصلی
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">همه محصولات</span>
      </nav>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <FilterSidebar values={filters} onChange={setFilters} />
        </aside>

        {/* Product listing */}
        <div className="flex-1">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">محصولات پروتئینی و سوپرمارکتی</h1>
              <span className="text-sm text-gray-500">
                نمایش {sortedProducts.length} کالا
              </span>
            </div>
            <SortDropdown value={sortOption} onChange={setSortOption} />
          </div>

          {sortedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-lg">کالایی با این فیلترها یافت نشد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {sortedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
