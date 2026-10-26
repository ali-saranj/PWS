'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Flame, Plus, Check, ArrowLeft, Percent, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import { formatToman, toPersianDigits } from '@/lib/format';

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
  const addItem = useCartStore((state) => state.addItem);
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({});

  const handleAddToCart = (product: ProductItem) => {
    const effectiveVariantId = product.defaultVariantId || product.variantId || product.id * 10;
    addItem({
      id: `prod-${product.id}`,
      productId: product.id,
      variantId: effectiveVariantId,
      name: product.nameFa,
      variantName: product.weightLabel || 'بسته استاندارد',
      priceToman: product.priceToman,
      imageUrl: product.thumbnailUrl,
      quantity: 1,
    });

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

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
          {items.map((prod) => {
            const isAdded = !!addedIds[prod.id];
            const discount =
              prod.discountPercent ||
              (prod.compareAtPriceToman && prod.compareAtPriceToman > prod.priceToman
                ? Math.round(
                    ((prod.compareAtPriceToman - prod.priceToman) /
                      prod.compareAtPriceToman) *
                      100
                  )
                : 20);

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl p-3 sm:p-4 border border-rose-100/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative"
              >
                {/* Discount Badge */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs font-extrabold shadow-sm">
                    <Percent className="w-2.5 h-2.5" />
                    <span>٪{toPersianDigits(discount)}</span>
                  </span>
                </div>

                {/* Thumbnail */}
                <Link
                  href={`/product/${prod.slug}`}
                  className="block relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3 group-hover:opacity-90 transition-opacity"
                >
                  {prod.thumbnailUrl ? (
                    <img
                      src={prod.thumbnailUrl}
                      alt={prod.nameFa}
                      className="w-full h-full object-contain p-2"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback placeholder styling
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300 -z-0">
                    <ShoppingBag className="w-10 h-10 stroke-[1.2]" />
                  </div>
                </Link>

                {/* Details */}
                <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    {prod.brandNameFa && (
                      <span className="text-[11px] font-medium text-gray-400 block">
                        {prod.brandNameFa}
                      </span>
                    )}
                    <Link
                      href={`/product/${prod.slug}`}
                      className="text-xs sm:text-sm font-bold text-gray-800 line-clamp-2 hover:text-primary transition-colors leading-tight"
                      title={prod.nameFa}
                    >
                      {prod.nameFa}
                    </Link>
                    {prod.weightLabel && (
                      <span className="text-[11px] text-gray-500 block pt-1">
                        {prod.weightLabel}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="pt-2">
                    {prod.compareAtPriceToman && (
                      <div className="text-xs text-gray-400 line-through">
                        {formatToman(prod.compareAtPriceToman)} تومان
                      </div>
                    )}
                    <div className="flex items-baseline gap-1 text-primary font-black text-sm sm:text-base">
                      <span>{formatToman(prod.priceToman)}</span>
                      <span className="text-[11px] font-medium text-gray-500">تومان</span>
                    </div>
                  </div>
                </div>

                {/* Direct Add To Cart Button */}
                <button
                  type="button"
                  onClick={() => handleAddToCart(prod)}
                  className={`mt-3 w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-primary hover:bg-primary-dark text-white'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>افزوده شد</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>افزودن به سبد</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SpecialOffersCarousel;
