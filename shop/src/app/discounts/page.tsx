import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';
import { fetchCatalogProducts } from '@/lib/serverCatalog';
import { BRAND } from '@/config/branding';

export const metadata: Metadata = {
  title: `تخفیف‌ها و پیشنهادهای شگفت‌انگیز | ${BRAND.nameFa}`,
  description: `مشاهده و خرید آنلاین محصولات تخفیف‌دار و پیشنهادات شگفت‌انگیز در فروشگاه ${BRAND.nameFa}`,
  alternates: {
    canonical: `${BRAND.domain}/discounts`,
  },
};

interface DiscountsPageProps {
  searchParams?: Promise<{
    page?: string;
    sort?: string;
  }>;
}

export default async function DiscountsPage({ searchParams }: DiscountsPageProps) {
  const params = (await searchParams) || {};
  const page = params.page ? Math.max(0, Number(params.page)) : 0;
  const sort = params.sort || 'newest';
  const pageSize = 24;

  const catalogData = await fetchCatalogProducts({
    onSale: true,
    sort,
    page,
    size: pageSize,
  });

  const pageUrlPattern = (() => {
    const q = new URLSearchParams();
    if (sort && sort !== 'newest') q.set('sort', sort);
    q.set('page', '__PAGE__');
    const qs = q.toString();
    return `/discounts?${qs}`;
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
        <span className="text-gray-900 font-medium">تخفیف‌ها و پیشنهادهای شگفت‌انگیز</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-500 to-red-600 rounded-3xl p-8 mb-8 text-white shadow-lg shadow-rose-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
            <Flame className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
              پیشنهادهای شگفت‌انگیز و تخفیف‌های ویژه
            </h1>
            <p className="text-rose-100 text-sm">
              بهترین فرآورده‌های پروتئینی، سوسیس، کالباس و اقلام سوپرمارکتی با تخفیف‌های استثنایی
            </p>
          </div>
        </div>
        <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/20 text-center">
          <span className="text-xs text-rose-100 block">تخفیف‌های ویژه روز</span>
          <span className="text-xl font-bold">تأمین روزانه تازه</span>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-lg">در حال حاضر کالای تخفیف‌داری ثبت نشده است.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>

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
    </div>
  );
}
