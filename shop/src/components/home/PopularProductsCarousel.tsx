'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Heart, Plus, Check, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import { formatToman, toPersianDigits } from '@/lib/format';

export interface PopularProductItem {
  id: number;
  slug: string;
  nameFa: string;
  nameEn?: string;
  brandNameFa?: string;
  categoryNameFa?: string;
  thumbnailUrl?: string;
  priceToman: number;
  compareAtPriceToman?: number;
  rating?: number;
  reviewsCount?: number;
  portionLabel?: string;
  inStock?: boolean;
  defaultVariantId?: number;
  variantId?: number;
}

export const DEFAULT_POPULAR_PRODUCTS: PopularProductItem[] = [
  {
    id: 201,
    slug: 'andre-cocktail-cheese-sausage',
    nameFa: 'سوسیس کوکتل پنیر آندره',
    brandNameFa: 'آندره',
    portionLabel: '۵۰۰ گرم',
    priceToman: 210000,
    compareAtPriceToman: 235000,
    rating: 5,
    reviewsCount: 42,
    thumbnailUrl: '/images/products/cocktail-cheese.png',
    inStock: true,
  },
  {
    id: 202,
    slug: 'solico-beef-bacon',
    nameFa: 'بیکن گوشت سولیکو',
    brandNameFa: 'سولیکو',
    portionLabel: '۳۰۰ گرم اسلایس',
    priceToman: 275000,
    rating: 5,
    reviewsCount: 38,
    thumbnailUrl: '/images/products/bacon.png',
    inStock: true,
  },
  {
    id: 203,
    slug: 'kalleh-gouda-cheese-slices',
    nameFa: 'پنیر گودا ورقی کاله',
    brandNameFa: 'کاله',
    portionLabel: '۱۸۰ گرم (۱۰ ورقه)',
    priceToman: 98000,
    rating: 5,
    reviewsCount: 56,
    thumbnailUrl: '/images/products/gouda.png',
    inStock: true,
  },
  {
    id: 204,
    slug: 'bijan-french-sauce',
    nameFa: 'سس فرانسوی کلاسیک بیژن',
    brandNameFa: 'بیژن',
    portionLabel: '۴۵۰ گرم',
    priceToman: 48000,
    rating: 5,
    reviewsCount: 19,
    thumbnailUrl: '/images/products/french-sauce.png',
    inStock: true,
  },
  {
    id: 205,
    slug: 'nan-avaran-burger-buns',
    nameFa: 'نان برگر کنجدی نان‌آوران',
    brandNameFa: 'نان‌آوران',
    portionLabel: 'بسته ۴ عددی',
    priceToman: 38000,
    rating: 5,
    reviewsCount: 27,
    thumbnailUrl: '/images/products/burger-buns.png',
    inStock: true,
  },
];

export interface PopularProductsCarouselProps {
  products?: PopularProductItem[];
}

export const PopularProductsCarousel: React.FC<PopularProductsCarouselProps> = ({
  products = DEFAULT_POPULAR_PRODUCTS,
}) => {
  const items = products && products.length > 0 ? products : DEFAULT_POPULAR_PRODUCTS;
  const addItem = useCartStore((state) => state.addItem);
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({});
  const [wishlist, setWishlist] = useState<Record<number, boolean>>({});

  const handleAddToCart = (product: PopularProductItem) => {
    const effectiveVariantId = product.defaultVariantId || product.variantId || product.id * 10;
    addItem({
      id: `prod-${product.id}`,
      productId: product.id,
      variantId: effectiveVariantId,
      name: product.nameFa,
      variantName: product.portionLabel || 'بسته استاندارد',
      priceToman: product.priceToman,
      imageUrl: product.thumbnailUrl,
      quantity: 1,
    });

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  const toggleWishlist = (id: number) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="py-6" aria-label="پرفروش‌ترین محصولات">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
            <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900">
              پرفروش‌ترین محصولات
            </h2>
            <p className="text-xs text-gray-500">
              محبوب‌ترین انتخاب‌های خریداران پروتئین ایرانی در هفته گذشته
            </p>
          </div>
        </div>

        <Link
          href="/products"
          className="flex items-center gap-1 text-xs sm:text-sm font-bold text-primary hover:text-primary-dark transition-colors"
        >
          <span>مشاهده همه</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid of popular items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {items.map((prod) => {
          const isAdded = !!addedIds[prod.id];
          const isFavorited = !!wishlist[prod.id];
          const rating = prod.rating || 5;
          const reviews = prod.reviewsCount || 25;

          return (
            <div
              key={prod.id}
              className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative"
            >
              {/* Wishlist button */}
              <button
                type="button"
                onClick={() => toggleWishlist(prod.id)}
                className={`absolute top-2.5 left-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                  isFavorited
                    ? 'bg-rose-50 text-rose-500'
                    : 'bg-white/80 text-gray-400 hover:text-rose-500 hover:bg-white'
                }`}
                aria-label={`افزودن ${prod.nameFa} به علاقه‌مندی‌ها`}
              >
                <Heart
                  className={`w-4 h-4 transition-transform active:scale-125 ${
                    isFavorited ? 'fill-rose-500 text-rose-500' : ''
                  }`}
                />
              </button>

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
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mb-1">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400">
                      ({toPersianDigits(reviews)})
                    </span>
                  </div>

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

                  {prod.portionLabel && (
                    <span className="text-[11px] text-gray-500 block pt-1">
                      {prod.portionLabel}
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
                  <div className="flex items-baseline gap-1 text-gray-900 font-black text-sm sm:text-base">
                    <span>{formatToman(prod.priceToman)}</span>
                    <span className="text-[11px] font-medium text-gray-500">تومان</span>
                  </div>
                </div>
              </div>

              {/* Direct Add to Cart Button */}
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
    </section>
  );
};

export default PopularProductsCarousel;
