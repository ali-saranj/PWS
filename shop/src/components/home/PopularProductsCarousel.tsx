'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ArrowLeft } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';

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
        {items.map((prod) => (
          <ProductCard key={prod.id} product={prod} />
        ))}
      </div>
    </section>
  );
};

export default PopularProductsCarousel;
