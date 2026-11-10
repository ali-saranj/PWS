'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, Award } from 'lucide-react';
import type { BrandItem } from '@/lib/serverCatalog';
import { toPersianDigits } from '@/lib/format';

interface BrandsDirectoryProps {
  initialBrands: BrandItem[];
}

export default function BrandsDirectory({ initialBrands }: BrandsDirectoryProps) {
  const [search, setSearch] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initialBrands;
    return initialBrands.filter(
      (b) =>
        b.nameFa.toLowerCase().includes(q) ||
        (b.nameEn && b.nameEn.toLowerCase().includes(q))
    );
  }, [initialBrands, search]);

  const handleImageError = (id: number) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجوی برند (فارسی یا انگلیسی)..."
          className="w-full pl-4 pr-11 py-3 bg-white rounded-2xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all"
        />
        <Search className="w-5 h-5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-medium"
          >
            پاک کردن
          </button>
        )}
      </div>

      {/* Brands Grid */}
      {filteredBrands.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredBrands.map((b) => {
            const hasLogo = Boolean(b.logoUrl && !imageErrors[b.id]);
            const initialLetter = (b.nameFa || b.nameEn || 'ب').trim().charAt(0);

            return (
              <Link
                key={b.id || b.slug}
                href={`/products?brandId=${b.id}`}
                className="group bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col items-center text-center justify-between"
              >
                <div className="w-full flex flex-col items-center">
                  {/* Brand Visual: Logo or Monogram Avatar */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center p-3 mb-4 group-hover:scale-105 transition-transform overflow-hidden">
                    {hasLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.logoUrl!}
                        alt={b.nameFa}
                        onError={() => handleImageError(b.id)}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-2xl font-black shadow-inner">
                        {initialLetter}
                      </div>
                    )}
                  </div>

                  {/* Brand Titles */}
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-primary transition-colors mb-1 line-clamp-1">
                    {b.nameFa}
                  </h2>
                  {b.nameEn && (
                    <span className="text-xs text-gray-400 font-medium mb-3">
                      {b.nameEn}
                    </span>
                  )}
                </div>

                {/* Card Action Link Indicator */}
                <div className="w-full pt-3 mt-2 border-t border-gray-50 flex items-center justify-center gap-1 text-xs text-primary font-semibold group-hover:underline">
                  <span>مشاهده محصولات</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-700 mb-1">
            برندی با این مشخصات یافت نشد
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            عبارت دیگری را جستجو کنید یا همه برندها را مشاهده فرمایید.
          </p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-xs font-semibold text-primary hover:underline"
          >
            نمایش تمامی برندها
          </button>
        </div>
      )}
    </div>
  );
}
