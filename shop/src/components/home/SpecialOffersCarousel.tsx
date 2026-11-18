'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, ArrowLeft } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';

export interface ProductItem {
  id: number;
  slug: string;
  nameFa: string;
  nameEn?: string;
  brandNameFa?: string;
  categoryNameFa?: string;
  thumbnailUrl?: string;
  priceToman: number;
  compareAtPriceToman?: number;
  discountPercent?: number;
  inStock?: boolean;
  totalStock?: number;
  weightLabel?: string;
  defaultVariantId?: number;
  variantId?: number;
}

export const DEFAULT_SPECIAL_OFFERS: ProductItem[] = [
  {
    id: 101,
    slug: 'andre-turkey-ham-90',
    nameFa: 'ژامبون بوقلمون ۹۰٪ آندره',
    brandNameFa: 'آندره',
    weightLabel: '۲۵۰ گرم اسلایس',
    priceToman: 240000,
    compareAtPriceToman: 320000,
    discountPercent: 25,
    thumbnailUrl: '/images/products/turkey-ham.png',
    inStock: true,
  },
  {
    id: 102,
    slug: 'frankfurter-sausage-202',
    nameFa: 'سوسیس فرانکفورتر ۲۰۲',
    brandNameFa: '۲۰۲',
    weightLabel: '۵۰۰ گرم',
    priceToman: 180000,
    compareAtPriceToman: 225000,
    discountPercent: 20,
    thumbnailUrl: '/images/products/sausage-202.png',
    inStock: true,
  },
  {
    id: 103,
    slug: 'mikaelian-dry-salami',
    nameFa: 'کالباس خشک ممتاز میکائیلیان',
    brandNameFa: 'میکائیلیان',
    weightLabel: '۳۰۰ گرم اسلایس',
    priceToman: 195000,
    compareAtPriceToman: 260000,
    discountPercent: 25,
    thumbnailUrl: '/images/products/salami.png',
    inStock: true,
  },
  {
    id: 104,
    slug: 'robat-beef-hotdog-80',
    nameFa: 'هات‌داگ گوشت ۸۰٪ رباط',
    brandNameFa: 'رباط',
    weightLabel: '۴۰۰ گرم',
    priceToman: 155000,
    compareAtPriceToman: 200000,
    discountPercent: 22,
    thumbnailUrl: '/images/products/hotdog.png',
    inStock: true,
  },
  {
    id: 105,
    slug: 'badr-premium-pickles',
    nameFa: 'خیارشور ویژه ممتاز بدر',
    brandNameFa: 'بدر',
    weightLabel: '۶۸۰ گرم شیشه‌ای',
    priceToman: 65000,
    compareAtPriceToman: 85000,
    discountPercent: 24,
    thumbnailUrl: '/images/products/pickles.png',
    inStock: true,
  },
];

export interface SpecialOffersCarouselProps {
  products?: ProductItem[];
}

export const SpecialOffersCarousel: React.FC<SpecialOffersCarouselProps> = ({
  products = DEFAULT_SPECIAL_OFFERS,
}) => {
  const items = products && products.length > 0 ? products : DEFAULT_SPECIAL_OFFERS;

  return (
    <section className="py-6" aria-label="پیشنهادهای شگفت‌انگیز">
      <div className="bg-gradient-to-r from-rose-500/10 via-rose-50 to-amber-50/40 rounded-3xl p-4 sm:p-6 border border-rose-100 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Flame className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-gray-900">
                  پیشنهادهای شگفت‌انگیز
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                  تخفیف محدود
                </span>
              </div>
              <p className="text-xs text-gray-500">
                فرصت خرید روزانه با بیشترین تخفیف‌ها
              </p>
            </div>
          </div>

          <Link
            href="/discounts"
            className="flex items-center gap-1 text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 transition-colors"
          >
            <span>مشاهده همه</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Cards Row / Horizontal Scroll */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 overflow-x-auto pb-2">
          {items.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecialOffersCarousel;
