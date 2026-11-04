'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PackageOpen, Award } from 'lucide-react';
import { ProductCard, ProductData as CatalogProduct } from '@/components/ProductCard';
import { FilterSidebar, FilterState } from '@/components/FilterSidebar';
import { SortDropdown, SortOptionKey } from '@/components/SortDropdown';
import { toPersianDigits } from '@/lib/format';
import type { BrandItem, CategoryItem } from '@/lib/serverCatalog';
import { api } from '@/lib/api';

interface BrandShowcaseContentProps {
  brand: BrandItem;
  initialProducts?: CatalogProduct[];
  categories?: CategoryItem[];
}

export default function BrandShowcaseContent({
  brand,
  initialProducts = [],
  categories,
}: BrandShowcaseContentProps) {
  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);
  const [imageError, setImageError] = useState(false);
  const [sort, setSort] = useState<SortOptionKey>('newest');
  const [filters, setFilters] = useState<FilterState>({
    categoryId: null,
    brandId: brand.id,
    brands: [brand.nameFa],
    inStockOnly: false,
    onSaleOnly: false,
    minPrice: null,
    maxPrice: null,
  });

  // If initialProducts was empty at mount, fetch from API
  useEffect(() => {
    let active = true;

    if (initialProducts.length === 0 && brand.slug) {
      api
        .get<{ items?: CatalogProduct[]; content?: CatalogProduct[] }>(
          `/api/shop/catalog/products?brandSlug=${encodeURIComponent(brand.slug)}`
        )
        .then((res) => {
          if (!active) return;
          const list = res?.items || res?.content;
          if (Array.isArray(list)) {
            setProducts(list);
          }
        })
        .catch(() => {
          // ignore or keep empty
        });
    }

    return () => {
      active = false;
    };
  }, [brand.slug, initialProducts.length]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter: In-Stock only
    if (filters.inStockOnly) {
      result = result.filter((p) => p.inStock);
    }

    // Filter: On-Sale only
    if (filters.onSaleOnly) {
      result = result.filter(
        (p) =>
          (p.discountPercent && p.discountPercent > 0) ||
          (p.compareAtPriceToman && p.compareAtPriceToman > p.priceToman)
      );
    }

    // Filter: Category
    if (filters.categoryId) {
      result = result.filter(
        (p) =>
          String(p.categoryId) === String(filters.categoryId) ||
          p.categorySlug === String(filters.categoryId)
      );
    }

    // Filter: Price range
    if (filters.minPrice !== null && filters.minPrice !== undefined) {
      result = result.filter((p) => p.priceToman >= filters.minPrice!);
    }
    if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
      result = result.filter((p) => p.priceToman <= filters.maxPrice!);
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case 'popular':
          return (b.totalStock ?? 0) - (a.totalStock ?? 0);
        case 'price_asc':
          return a.priceToman - b.priceToman;
        case 'price_desc':
          return b.priceToman - a.priceToman;
        case 'newest':
        default:
          return b.id - a.id;
      }
    });

    return result;
  }, [products, filters, sort]);

  const hasLogo = Boolean(brand.logoUrl && !imageError);
  const initialLetter = (brand.nameFa || brand.nameEn || 'ب').trim().charAt(0);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 font-vazirmatn">
      {/* Brand Header Banner with Breadcrumb & Details */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 mb-6 shadow-sm">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
          <Link href="/" className="hover:text-primary transition-colors">
            صفحه اصلی
          </Link>
          <span>/</span>
          <Link href="/brands" className="hover:text-primary transition-colors">
            برندها
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-semibold">{brand.nameFa}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Brand Logo or Monogram Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2.5 overflow-hidden shadow-inner">
              {hasLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logoUrl!}
                  alt={brand.nameFa}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-black">
                  {initialLetter}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                  {brand.nameFa}
                </h1>
                {brand.nameEn && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary-dark">
                    {brand.nameEn}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                تضمین کیفیت و اصالت تمامی کالاهای برند {brand.nameFa}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm text-gray-500 font-semibold bg-gray-100 px-3 py-1.5 rounded-xl">
              {toPersianDigits(filteredAndSortedProducts.length)} محصول
            </span>
            <SortDropdown value={sort} onChange={setSort} />
          </div>
        </div>
      </div>

      {/* Main Layout: Filter Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Filter Sidebar */}
        <div className="lg:col-span-1">
          <FilterSidebar
            categories={categories}
            values={filters}
            onChange={setFilters}
            onReset={() =>
              setFilters({
                categoryId: null,
                brandId: brand.id,
                brands: [brand.nameFa],
                inStockOnly: false,
                onSaleOnly: false,
                minPrice: null,
                maxPrice: null,
              })
            }
          />
        </div>

        {/* Product Listing / Empty State */}
        <div className="lg:col-span-3">
          {filteredAndSortedProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-8 sm:p-14 text-center my-2 shadow-sm">
              <PackageOpen className="w-16 h-16 text-gray-300 mx-auto mb-4 stroke-[1.5]" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                محصولی برای این برند یافت نشد
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6">
                می‌توانید فیلترهای انتخابی را تغییر دهید یا از سایر برندها بازدید فرمایید.
              </p>
              <Link
                href="/brands"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors"
              >
                مشاهده سایر برندها
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {filteredAndSortedProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
