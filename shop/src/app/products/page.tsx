import React from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { fetchCatalogProducts, fetchCategories, fetchBrands } from '@/lib/serverCatalog';
import { FilterState } from '@/components/FilterSidebar';
import { SortOptionKey } from '@/components/SortDropdown';

interface ProductsPageProps {
  searchParams: Promise<{
    categoryId?: string;
    categorySlug?: string;
    brandId?: string;
    brandSlug?: string;
    inStock?: string;
    onSale?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const rawCatId = params.categoryId;
  let categoryId: number | undefined = undefined;
  let categorySlug: string | undefined = params.categorySlug;
  if (rawCatId) {
    const num = Number(rawCatId);
    if (!Number.isNaN(num)) {
      categoryId = num;
    } else {
      categorySlug = rawCatId;
    }
  }

  const rawBrandId = params.brandId;
  let brandId: number | undefined = undefined;
  let brandSlug: string | undefined = params.brandSlug;
  if (rawBrandId) {
    const num = Number(rawBrandId);
    if (!Number.isNaN(num)) {
      brandId = num;
    } else {
      brandSlug = rawBrandId;
    }
  }

  const inStock = params.inStock === 'true';
  const onSale = params.onSale === 'true';
  const rawMinPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const minPriceToman =
    rawMinPrice !== undefined && !Number.isNaN(rawMinPrice) ? rawMinPrice : undefined;
  const rawMaxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const maxPriceToman =
    rawMaxPrice !== undefined && !Number.isNaN(rawMaxPrice) ? rawMaxPrice : undefined;
  const minPriceRials = minPriceToman !== undefined ? minPriceToman * 10 : undefined;
  const maxPriceRials = maxPriceToman !== undefined ? maxPriceToman * 10 : undefined;
  const sort = (params.sort as SortOptionKey) || 'newest';
  const rawPage = params.page ? Number(params.page) : 0;
  const page = !Number.isNaN(rawPage) ? Math.max(0, rawPage) : 0;
  const pageSize = 24;

  const [catalogData, categories, brands] = await Promise.all([
    fetchCatalogProducts({
      categoryId,
      categorySlug,
      brandId,
      brandSlug,
      inStock: inStock || undefined,
      onSale: onSale || undefined,
      minPriceRials,
      maxPriceRials,
      sort,
      page,
      size: pageSize,
    }),
    fetchCategories(),
    fetchBrands(),
  ]);

  const initialFilters: FilterState = {
    categoryId: categoryId ?? categorySlug ?? null,
    brandId: brandId ?? null,
    brands: [],
    inStockOnly: inStock,
    onSaleOnly: onSale,
    minPrice: minPriceToman ?? null,
    maxPrice: maxPriceToman ?? null,
  };

  const pageUrlPattern = (() => {
    const q = new URLSearchParams();
    if (categoryId !== undefined) {
      q.set('categoryId', String(categoryId));
    } else if (categorySlug) {
      q.set('categoryId', categorySlug);
    }
    if (brandId !== undefined) {
      q.set('brandId', String(brandId));
    } else if (brandSlug) {
      q.set('brandSlug', brandSlug);
    }
    if (inStock) q.set('inStock', 'true');
    if (onSale) q.set('onSale', 'true');
    if (minPriceToman !== undefined) q.set('minPrice', String(minPriceToman));
    if (maxPriceToman !== undefined) q.set('maxPrice', String(maxPriceToman));
    if (sort && sort !== 'newest') q.set('sort', sort);
    q.set('page', '__PAGE__');
    const qs = q.toString();
    return `/products?${qs}`;
  })();

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

      {/* Catalog Layout with Filters, Sort and Products */}
      <CatalogFilters
        categories={categories}
        brands={brands}
        initialFilters={initialFilters}
        initialSort={sort}
        totalElements={totalElements}
      >
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-lg">کالایی با این فیلترها یافت نشد.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
              pageUrlPattern={pageUrlPattern}
              className="mt-8"
            />
          </>
        )}
      </CatalogFilters>
    </div>
  );
}
