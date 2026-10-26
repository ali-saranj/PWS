'use client';

import React from 'react';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { MOCK_CATALOG_PRODUCTS } from '@/lib/mockProducts';

export default function DiscountsPage() {
  const saleProducts = MOCK_CATALOG_PRODUCTS.filter(
    (p) => (p.discountPercent ?? 0) > 0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-vazirmatn">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
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
            <h1 className="text-3xl font-extrabold mb-2">پیشنهادهای شگفت‌انگیز و تخفیف‌های ویژه</h1>
            <p className="text-rose-100 text-sm">
              بهترین فرآورده‌های پروتئینی، سوسیس، کالباس و اقلام سوپرمارکتی با تخفیف‌های استثنایی
            </p>
          </div>
        </div>
        <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/20 text-center">
          <span className="text-xs text-rose-100 block">تا ۵۰٪ تخفیف</span>
          <span className="text-xl font-bold">تأمین روزانه تازه</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {saleProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
