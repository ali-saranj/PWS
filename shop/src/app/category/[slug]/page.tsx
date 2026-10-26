'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Beef,
  Apple,
  Salad,
  Sandwich,
  Cookie,
  Package,
  Milk,
  SlidersHorizontal,
  PackageOpen,
  type LucideIcon,
} from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { FilterSidebar, FilterState } from '@/components/FilterSidebar';
import { SortDropdown, SortOptionKey } from '@/components/SortDropdown';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { formatToman, toPersianDigits } from '@/lib/format';
import { api } from '@/lib/api';
import { DEFAULT_CATEGORIES, CategoryItem } from '@/components/home/CategoryCircles';
import { MOCK_CATALOG_PRODUCTS, CatalogProduct } from '@/lib/mockProducts';

const categoryIconMap: Record<string, LucideIcon> = {
  'sausage-hotdog': Beef,
  'ham-coldcuts': UtensilsCrossed,
  'pickles': Apple,
  'sauces-condiments': Salad,
  'bread': Sandwich,
  'snacks-chips': Cookie,
  'canned-food': Package,
  'dairy-cheese': Milk,
};

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

function CategoryPageContent({ slug }: { slug: string }) {
  const currentCategory = useMemo(() => {
    return (
      DEFAULT_CATEGORIES.find((c) => c.slug === slug) || {
        id: slug === 'all' ? 0 : 99,
        nameFa: slug === 'all' ? 'همه محصولات' : slug,
        slug: slug,
        color: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
      }
    );
  }, [slug]);

  const IconComponent = categoryIconMap[slug] || UtensilsCrossed;

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortOptionKey>('newest');
  const [filters, setFilters] = useState<FilterState>({
    categoryId: slug !== 'all' ? currentCategory.id || slug : null,
    brands: [],
    inStockOnly: false,
    onSaleOnly: false,
    minPrice: null,
    maxPrice: null,
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      categoryId: slug !== 'all' ? currentCategory.id || slug : null,
    }));
  }, [slug, currentCategory]);

  // Fetch products from API or fallback
  useEffect(() => {
    let active = true;

    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        const queryParam = currentCategory.id ? `categoryId=${currentCategory.id}` : `slug=${slug}`;
        const res = await api.get<{ items?: any[]; content?: any[] }>(`/api/shop/catalog/products?${queryParam}`);
        const productList = res?.items || res?.content;
        if (active && productList && Array.isArray(productList)) {
          setProducts(productList);
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to local catalog mock
      }

      if (active) {
        if (slug === 'all') {
          setProducts(MOCK_CATALOG_PRODUCTS);
        } else {
          const matched = MOCK_CATALOG_PRODUCTS.filter(
            (p) =>
              p.categorySlug === slug ||
              (currentCategory.id && p.categoryId === currentCategory.id)
          );
          setProducts(matched.length > 0 ? matched : MOCK_CATALOG_PRODUCTS);
        }
        setLoading(false);
      }
    };

    fetchCategoryProducts();

    return () => {
      active = false;
    };
  }, [slug, currentCategory]);

  // Apply filters and sorting
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

    // Filter: Brands
    if (filters.brands && filters.brands.length > 0) {
      result = result.filter(
        (p) => p.brandNameFa && filters.brands.includes(p.brandNameFa)
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-vazirmatn dir-rtl">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Category Header with Icon and Title */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 mb-6 shadow-sm">
          <div className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
            <Link href="/" className="hover:text-primary transition-colors">
              خانه
            </Link>
            <span>/</span>
            <Link href="/category/all" className="hover:text-primary transition-colors">
              دسته‌بندی‌ها
            </Link>
            <span>/</span>
            <span className="text-gray-700 font-semibold">{currentCategory.nameFa}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-sm">
                <IconComponent className="w-8 h-8 stroke-[1.8]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                  {currentCategory.nameFa}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  تضمین تازگی و کیفیت درجه یک سبد سبز
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

        {/* Content Layout: Sidebar + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <FilterSidebar
              values={filters}
              onChange={setFilters}
              onReset={() =>
                setFilters({
                  categoryId: slug !== 'all' ? currentCategory.id || slug : null,
                  brands: [],
                  inStockOnly: false,
                  onSaleOnly: false,
                  minPrice: null,
                  maxPrice: null,
                })
              }
            />
          </div>

          {/* Product Grid / Empty State */}
          <div className="lg:col-span-3">
            {filteredAndSortedProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-8 sm:p-14 text-center my-2 shadow-sm">
                <PackageOpen className="w-16 h-16 text-gray-300 mx-auto mb-4 stroke-[1.5]" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                  محصولی در این دسته‌بندی یافت نشد
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6">
                  می‌توانید فیلترهای انتخابی را تغییر دهید یا از سایر دسته‌بندی‌ها بازدید فرمایید.
                </p>
                <Link
                  href="/category/all"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors"
                >
                  مشاهده همه محصولات
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
      </main>

      <Footer />
    </div>
  );
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const [resolvedSlug, setResolvedSlug] = useState<string>('');

  useEffect(() => {
    let active = true;
    if (params) {
      if (typeof (params as any)?.then === 'function') {
        params.then((p) => {
          if (active) setResolvedSlug(p?.slug || '');
        });
      } else {
        setResolvedSlug((params as unknown as { slug: string }).slug || '');
      }
    }
    return () => {
      active = false;
    };
  }, [params]);

  if (!resolvedSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center font-vazirmatn text-gray-500">
        در حال بارگذاری دسته‌بندی...
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-vazirmatn text-gray-500">
          در حال بارگذاری محصولات دسته‌بندی...
        </div>
      }
    >
      <CategoryPageContent slug={resolvedSlug} />
    </Suspense>
  );
}
