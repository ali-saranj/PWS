import React from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { fetchCatalogProducts, fetchCategories } from '@/lib/serverCatalog';
import { FilterState } from '@/components/FilterSidebar';
import { SortOptionKey } from '@/components/SortDropdown';

interface ProductsPageProps {
  searchParams: Promise<{
    categoryId?: string;
    brandId?: string;
    onSale?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const categoryId = params.categoryId ? Number(params.categoryId) : undefined;
  const brandId = params.brandId ? Number(params.brandId) : undefined;
  const onSale = params.onSale === 'true';
  const minPriceToman = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPriceToman = params.maxPrice ? Number(params.maxPrice) : undefined;
  const minPriceRials = minPriceToman !== undefined ? minPriceToman * 10 : undefined;
  const maxPriceRials = maxPriceToman !== undefined ? maxPriceToman * 10 : undefined;
  const sort = (params.sort as SortOptionKey) || 'newest';
  const page = params.page ? Math.max(0, Number(params.page)) : 0;
  const pageSize = 24;

  const [catalogData, categories] = await Promise.all([
    fetchCatalogProducts({
      categoryId,
      brandId,
      onSale: onSale || undefined,
      minPriceRials,
      maxPriceRials,
      sort,
      page,
      size: pageSize,
    }),
    fetchCategories(),
  ]);

  const initialFilters: FilterState = {
    categoryId: categoryId ?? null,
    brands: [],
    inStockOnly: false,
    onSaleOnly: onSale,
    minPrice: minPriceToman ?? null,
    maxPrice: maxPriceToman ?? null,
  };

  const createPageUrl = (targetPage: number) => {
    const q = new URLSearchParams();
    if (categoryId) q.set('categoryId', String(categoryId));
    if (brandId) q.set('brandId', String(brandId));
    if (onSale) q.set('onSale', 'true');
    if (minPriceToman) q.set('minPrice', String(minPriceToman));
    if (maxPriceToman) q.set('maxPrice', String(maxPriceToman));
    if (sort && sort !== 'newest') q.set('sort', sort);
    if (targetPage > 0) q.set('page', String(targetPage));
    const qs = q.toString();
    return `/products${qs ? `?${qs}` : ''}`;
  };

  const products = catalogData?.content ?? [];
  const totalElements = catalogData?.totalElements ?? 0;
  const totalPages = catalogData?.totalPages ?? 0;
  const currentPage = catalogData?.page ?? 0;
  const size = catalogData?.size ?? pageSize;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-vazirmatn" dir="rtl">
      {/* Breadcrumb */}
      <nav aria-label="مسیر راهنما" className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          صفحه اصلی
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">همه محصولات</span>
      </nav>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar filters and sorting controls */}
        <CatalogFilters
          categories={categories}
          initialFilters={initialFilters}
          initialSort={sort}
          totalElements={totalElements}
        />

        {/* Product listing grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-lg">کالایی با این فیلترها یافت نشد.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>

              {/* Server-driven Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={size}
                createPageUrl={createPageUrl}
                className="mt-8"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
