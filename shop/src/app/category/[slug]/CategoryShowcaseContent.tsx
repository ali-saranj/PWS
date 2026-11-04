'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UtensilsCrossed,
  Flame,
  Beef,
  Apple,
  Salad,
  Sandwich,
  Cookie,
  Package,
  Milk,
  Drumstick,
  Layers,
  SlidersHorizontal,
  PackageOpen,
  ChevronLeft,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import { ProductCard, ProductData as CatalogProduct } from '@/components/ProductCard';
import { FilterSidebar, FilterState } from '@/components/FilterSidebar';
import { SortDropdown, SortOptionKey } from '@/components/SortDropdown';
import { toPersianDigits } from '@/lib/format';
import type { CategoryDetail, CategoryItem, BrandItem, ProductSummary } from '@/lib/serverCatalog';
import { api } from '@/lib/api';

const categoryIconMap: Record<string, LucideIcon> = {
  'sausages-hotdogs': Flame,
  'sausage-hotdog': Flame,
  'turkey-ham': Drumstick,
  'cold-cuts-deli': UtensilsCrossed,
  'ham-coldcuts': UtensilsCrossed,
  'sausages-coldcuts': Flame,
  'beef-ham': Beef,
  'pickles-condiments': Apple,
  'pickles': Apple,
  'sauces': Salad,
  'sauces-condiments': Salad,
  'sandwich-bread': Sandwich,
  'bread': Sandwich,
  'chips-snacks': Cookie,
  'snacks-chips': Cookie,
  'canned-goods': Package,
  'canned-food': Package,
  'dairy-cheese': Milk,
  'dairy': Milk,
};

interface CategoryShowcaseContentProps {
  category: CategoryDetail;
  initialProducts?: ProductSummary[];
  brands?: BrandItem[];
  categories?: CategoryItem[];
}

export default function CategoryShowcaseContent({
  category,
  initialProducts = [],
  brands = [],
  categories = [],
}: CategoryShowcaseContentProps) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductSummary[]>(initialProducts);
  const [sort, setSort] = useState<SortOptionKey>('newest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    categoryId: category.id,
    brandId: null,
    brands: [],
    inStockOnly: false,
    onSaleOnly: false,
    minPrice: null,
    maxPrice: null,
  });

  const IconComponent = categoryIconMap[category.slug] || Layers;

  // Refresh products from client API if initialProducts was empty
  useEffect(() => {
    let active = true;

    if (initialProducts.length === 0 && category.slug) {
      api
        .get<{ items?: ProductSummary[]; content?: ProductSummary[] }>(
          `/api/shop/catalog/products?categorySlug=${encodeURIComponent(category.slug)}`
        )
        .then((res) => {
          if (!active) return;
          const list = res?.items || res?.content;
          if (Array.isArray(list)) {
            setProducts(list);
          }
        })
        .catch(() => {
          // ignore error
        });
    }

    return () => {
      active = false;
    };
  }, [category.slug, initialProducts.length]);

  // Available brands derived from products or prop
  const availableBrands = useMemo(() => {
    if (brands.length > 0) {
      return brands.map((b) => b.nameFa);
    }
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brandNameFa) set.add(p.brandNameFa);
    });
    return Array.from(set);
  }, [brands, products]);

  const sidebarCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories;
    }
    if (category.subcategories && category.subcategories.length > 0) {
      return [category, ...category.subcategories];
    }
    return [category];
  }, [categories, category]);

  const handleFilterChange = (newFilters: FilterState) => {
    if (newFilters.categoryId !== filters.categoryId) {
      if (newFilters.categoryId) {
        const target = sidebarCategories.find(
          (c) =>
            c.id === newFilters.categoryId ||
            String(c.id) === String(newFilters.categoryId) ||
            c.slug === newFilters.categoryId
        );
        if (target && target.slug !== category.slug) {
          setIsMobileFilterOpen(false);
          router.push(`/category/${target.slug}`);
          return;
        }
      } else {
        setIsMobileFilterOpen(false);
        if (category.parentId) {
          const parent = sidebarCategories.find((c) => c.id === category.parentId);
          if (parent) {
            router.push(`/category/${parent.slug}`);
            return;
          }
        }
        router.push('/categories');
        return;
      }
    }

    setFilters(newFilters);
  };

  // Filtering and sorting
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

    // Filter: Category / Subcategory
    if (
      filters.categoryId !== null &&
      filters.categoryId !== undefined &&
      filters.categoryId !== category.id &&
      String(filters.categoryId) !== String(category.id) &&
      filters.categoryId !== category.slug
    ) {
      result = result.filter(
        (p) =>
          p.categoryId === filters.categoryId ||
          String(p.categoryId) === String(filters.categoryId) ||
          p.categorySlug === String(filters.categoryId)
      );
    }

    // Filter: Brands
    if (filters.brands && filters.brands.length > 0) {
      result = result.filter(
        (p) => p.brandNameFa && filters.brands?.includes(p.brandNameFa)
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
  }, [products, filters, sort, category.id, category.slug]);

  const handleResetFilters = () => {
    setFilters({
      categoryId: category.id,
      brandId: null,
      brands: [],
      inStockOnly: false,
      onSaleOnly: false,
      minPrice: null,
      maxPrice: null,
    });
  };

  const hasActiveFilters =
    filters.inStockOnly ||
    filters.onSaleOnly ||
    (filters.brands && filters.brands.length > 0) ||
    (filters.categoryId !== null &&
      filters.categoryId !== undefined &&
      filters.categoryId !== category.id &&
      String(filters.categoryId) !== String(category.id) &&
      filters.categoryId !== category.slug) ||
    filters.minPrice !== null ||
    filters.maxPrice !== null;
    (filters.brands && filters.brands.length > 0) ||
    filters.minPrice !== null ||
    filters.maxPrice !== null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-vazirmatn">
      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          صفحه اصلی
        </Link>
        <span>/</span>
        <Link href="/categories" className="hover:text-primary transition-colors">
          دسته‌بندی‌ها
        </Link>
        {category.breadcrumbs && category.breadcrumbs.length > 0 ? (
          category.breadcrumbs.map((crumb, idx) => {
            const isLast = idx === category.breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id}>
                <span>/</span>
                {isLast ? (
                  <span className="text-gray-900 font-medium">{crumb.nameFa}</span>
                ) : (
                  <Link
                    href={`/category/${crumb.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {crumb.nameFa}
                  </Link>
                )}
              </React.Fragment>
            );
          })
        ) : (
          <>
            <span>/</span>
            <span className="text-gray-900 font-medium">{category.nameFa}</span>
          </>
        )}
      </nav>

      {/* Category Hero Header */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent rounded-3xl p-6 sm:p-8 mb-8 border border-emerald-100/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-primary">
              <IconComponent className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {category.nameFa}
                </h1>
                {category.nameEn && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-gray-500 border border-gray-200">
                    {category.nameEn}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                تضمین تازگی و کیفیت درجه یک سبد سبز با تحویل فوری
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-gray-400 block">تعداد کالاها</span>
            <span className="text-lg font-bold text-gray-800">
              {toPersianDigits(filteredAndSortedProducts.length)} محصول
            </span>
          </div>
        </div>

        {/* Subcategories chips */}
        {category.subcategories && category.subcategories.length > 0 && (
          <div className="mt-6 pt-5 border-t border-emerald-100/70">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-600">زیردسته‌ها:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {category.subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/category/${sub.slug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-primary/10 hover:text-primary text-gray-700 text-xs font-medium border border-emerald-100/80 shadow-2xs transition-colors"
                >
                  <span>{sub.nameFa}</span>
                  <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-24">
          <FilterSidebar
            categories={sidebarCategories}
            availableBrands={availableBrands}
            values={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </aside>

        {/* Product Grid Area */}
        <main className="flex-1 w-full">
          {/* Top Bar: Active filters reset, count & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            {/* Mobile filter button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 shadow-2xs"
            >
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <span>فیلترها</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>

            <div className="text-xs sm:text-sm text-gray-500">
              نمایش{' '}
              <span className="font-bold text-gray-900">
                {toPersianDigits(filteredAndSortedProducts.length)}
              </span>{' '}
              کالا
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>حذف فیلترها</span>
                </button>
              )}
              <SortDropdown value={sort} onChange={setSort} />
            </div>
          </div>

          {/* Product Cards */}
          {filteredAndSortedProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
              <PackageOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-800 mb-2">
                هیچ کالایی با فیلترهای انتخابی یافت نشد
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                می‌توانید فیلترها را حذف کنید یا دسته‌بندی‌های دیگر را بررسی کنید.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm"
                >
                  پاک کردن تمام فیلترها
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredAndSortedProducts.map((p) => (
                <ProductCard key={p.id} product={p as CatalogProduct} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative mr-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto z-10 flex flex-col justify-between">
            <FilterSidebar
              categories={sidebarCategories}
              availableBrands={availableBrands}
              values={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
            />
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="mt-6 w-full py-3 rounded-2xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary-hover transition-colors"
            >
              مشاهده {toPersianDigits(filteredAndSortedProducts.length)} کالا
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
