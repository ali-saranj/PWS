'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SearchX, SlidersHorizontal, PackageOpen } from 'lucide-react';
import { ProductCard, ProductData as CatalogProduct } from '@/components/ProductCard';
import { FilterSidebar, FilterState } from '@/components/FilterSidebar';
import { SortDropdown, SortOptionKey } from '@/components/SortDropdown';
import { formatToman, toPersianDigits } from '@/lib/format';
import { api } from '@/lib/api';

const FALLBACK_SEARCH_PRODUCTS: CatalogProduct[] = [
  {
    id: 101,
    slug: 'andre-turkey-ham-90',
    nameFa: 'ژامبون بوقلمون ۹۰٪ آندره',
    nameEn: 'Andre Turkey Ham 90%',
    brandNameFa: 'آندره',
    portionLabel: '۲۵۰ گرم اسلایس',
    weightLabel: '۲۵۰ گرم',
    priceToman: 240000,
    compareAtPriceToman: 320000,
    discountPercent: 25,
    thumbnailUrl: '/images/products/turkey-ham.png',
    categoryId: 2,
    categoryNameFa: 'کالباس و ژامبون',
    inStock: true,
    totalStock: 45,
  },
  {
    id: 102,
    slug: 'frankfurter-sausage-202',
    nameFa: 'سوسیس فرانکفورتر ۲۰۲',
    nameEn: '202 Frankfurter Sausage',
    brandNameFa: '۲۰۲',
    portionLabel: '۵۰۰ گرم',
    weightLabel: '۵۰۰ گرم',
    priceToman: 180000,
    compareAtPriceToman: 225000,
    discountPercent: 20,
    thumbnailUrl: '/images/products/sausage-202.png',
    categoryId: 1,
    categoryNameFa: 'سوسیس و هات‌داگ',
    inStock: true,
    totalStock: 30,
  },
  {
    id: 201,
    slug: 'andre-cocktail-cheese-sausage',
    nameFa: 'سوسیس کوکتل پنیر آندره',
    nameEn: 'Andre Cheese Cocktail Sausage',
    brandNameFa: 'آندره',
    portionLabel: '۵۰۰ گرم',
    weightLabel: '۵۰۰ گرم',
    priceToman: 210000,
    compareAtPriceToman: 235000,
    discountPercent: 11,
    thumbnailUrl: '/images/products/cocktail-cheese.png',
    categoryId: 1,
    categoryNameFa: 'سوسیس و هات‌داگ',
    inStock: true,
    totalStock: 25,
  },
];

interface SearchPageProps {
  params?: Promise<Record<string, string | string[] | undefined>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.trim() || '';
  const [products, setProducts] = useState<CatalogProduct[]>(FALLBACK_SEARCH_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortOptionKey>('newest');
  const [filters, setFilters] = useState<FilterState>({
    categoryId: null,
    brands: [],
    inStockOnly: false,
    onSaleOnly: false,
    minPrice: null,
    maxPrice: null,
  });

  // Fetch or fallback products reactively on query change
  useEffect(() => {
    let isCancelled = false;

    const fetchSearchResults = async () => {
      setLoading(true);

      try {
        const res = await api.get<{ items?: any[]; content?: any[] }>(
          `/api/shop/catalog/search?q=${encodeURIComponent(query)}`
        );
        const productList = res?.items || res?.content;
        if (!isCancelled && productList && Array.isArray(productList)) {
          setProducts(productList);
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to local mock data
      }

      if (!isCancelled) {
        if (!query) {
          setProducts(FALLBACK_SEARCH_PRODUCTS);
        } else {
          const lowerQ = query.toLowerCase();
          const matches = FALLBACK_SEARCH_PRODUCTS.filter((p) => {
            return (
              p.nameFa?.toLowerCase().includes(lowerQ) ||
              p.nameEn?.toLowerCase().includes(lowerQ) ||
              p.brandNameFa?.toLowerCase().includes(lowerQ) ||
              p.categoryNameFa?.toLowerCase().includes(lowerQ)
            );
          });
          setProducts(matches);
        }
        setLoading(false);
      }
    };

    fetchSearchResults();

    return () => {
      isCancelled = true;
    };
  }, [query]);

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
        (p) => p.brandNameFa && filters.brands?.includes(p.brandNameFa)
      );
    }

    // Filter: Category
    if (filters.categoryId) {
      result = result.filter(
        (p) =>
          p.categoryId === filters.categoryId ||
          p.categorySlug === filters.categoryId ||
          String(p.categoryId) === String(filters.categoryId)
      );
    }

    // Filter: Price range
    if (filters.minPrice !== null && filters.minPrice !== undefined) {
      result = result.filter((p) => p.priceToman >= filters.minPrice!);
    }
    if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
      result = result.filter((p) => p.priceToman <= filters.maxPrice!);
    }

    // Sort: Preserve API relevance order when searching with default 'newest' sort
    if (sort === 'popular') {
      result.sort((a, b) => (b.totalStock ?? 0) - (a.totalStock ?? 0));
    } else if (sort === 'price_asc') {
      result.sort((a, b) => a.priceToman - b.priceToman);
    } else if (sort === 'price_desc') {
      result.sort((a, b) => b.priceToman - a.priceToman);
    } else if (!query) {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [products, filters, sort, query]);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb & Search Heading */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
            <div>
              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1.5">
                <span>خانه</span>
                <span>/</span>
                <span>جستجو</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-gray-900 flex items-center gap-2">
                <span>نتایج جستجو برای:</span>
                <span className="text-primary font-bold">
                  «{query || 'همه محصولات'}»
                </span>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">
                  ({toPersianDigits(filteredAndSortedProducts.length)} کالا)
                </span>
              </h1>
            </div>

            {/* Sort Dropdown */}
            <SortDropdown value={sort} onChange={setSort} />
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
                  categoryId: null,
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
                <SearchX className="w-16 h-16 text-gray-300 mx-auto mb-4 stroke-[1.5]" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                  هیچ محصولی مطابق با جستجوی شما یافت نشد
                </h3>
                {query ? (
                  <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-4 leading-relaxed">
                    متأسفانه برای عبارت «{query}» نتیجه‌ای پیدا نشد.
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-4 leading-relaxed">
                    هیچ محصولی با فیلترهای انتخابی شما یافت نشد.
                  </p>
                )}
                <div className="bg-gray-50 rounded-xl p-4 max-w-sm mx-auto mb-6 text-right text-xs text-gray-600 space-y-1.5 border border-gray-100">
                  <p className="font-semibold text-gray-700">راهنمای جستجو:</p>
                  <p>• املای صحیح کلمات را بررسی کنید.</p>
                  <p>• از کلمات عمومی‌تر یا کوتاه‌تر استفاده کنید (مثل «سوسیس»، «ژامبون»، «پنیر»).</p>
                  <p>• فیلترهای اعمال‌شده را حذف کنید.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFilters({
                      categoryId: null,
                      brands: [],
                      inStockOnly: false,
                      onSaleOnly: false,
                      minPrice: null,
                      maxPrice: null,
                    })
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors"
                >
                  حذف تمام فیلترها
                </button>
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

export default function SearchPage(_props: SearchPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-vazirmatn text-gray-500">
          در حال بارگذاری نتایج جستجو...
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
