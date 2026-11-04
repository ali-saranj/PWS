import React from 'react';
import Link from 'next/link';
import { fetchBrands } from '@/lib/serverCatalog';
import BrandsDirectory from './BrandsDirectory';

export const metadata = {
  title: 'برندهای معتبر و ممتاز | سبد سبز',
  description: 'فهرست برندهای ممتاز و معتبر غذایی و پروتئینی در فروشگاه سبد سبز',
};

export default async function BrandsPage() {
  const brands = await fetchBrands();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-vazirmatn">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          صفحه اصلی
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">برندهای همکار</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">برندهای معتبر و ممتاز در سبد سبز</h1>
        <p className="text-gray-500 text-sm">
          تضمین کیفیت و اصالت تمامی کالاهای برندهای معتبر با تاریخ تولید روز
        </p>
      </div>

      <BrandsDirectory initialBrands={brands} />
    </div>
  );
}
