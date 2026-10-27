'use client';

import React, { useState } from 'react';
import { ShieldCheck, Award, Percent } from 'lucide-react';
import { toPersianDigits } from '@/lib/format';

export interface ProductImageGalleryProps {
  images: string[];
  title: string;
  discountPercent?: number | null;
  isBestseller?: boolean;
  freshDeliGuarantee?: boolean;
  badges?: string[];
  className?: string;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  title,
  discountPercent,
  isBestseller = true,
  freshDeliGuarantee = true,
  badges = [],
  className = '',
}) => {
  const displayImages = images.length > 0 ? images : ['/images/products/placeholder.png'];
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activeImage = displayImages[selectedIndex] || displayImages[0];

  // Filter out duplicate discount / percent badges if discountPercent is already shown
  const cleanBadges = badges.filter((b) => {
    if (!b) return false;
    if (discountPercent && discountPercent > 0 && (b.includes('%') || b.startsWith('-'))) {
      return false;
    }
    if (isBestseller && (b === 'پرفروش' || b.includes('پرفروش'))) {
      return false;
    }
    return true;
  }).slice(0, 2); // Max 2 extra contextual badges to keep image clear

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Main Image Container */}
      <div className="relative aspect-square w-full rounded-3xl bg-gradient-to-b from-gray-50/80 to-gray-100/60 border border-gray-100/90 overflow-hidden flex items-center justify-center p-6 shadow-sm">
        {/* Badges Overlay - Compact, clean horizontal wrap */}
        <div className="absolute top-4 right-4 flex flex-wrap items-center gap-1.5 max-w-[85%] z-10 pointer-events-none">
          {discountPercent && discountPercent > 0 ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-sm">
              <Percent className="w-3.5 h-3.5" />
              <span>{toPersianDigits(discountPercent)}٪ تخفیف</span>
            </span>
          ) : null}

          {isBestseller ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm">
              <Award className="w-3.5 h-3.5" />
              <span>پرفروش</span>
            </span>
          ) : null}

          {cleanBadges.map((badge, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm"
            >
              <span>{badge}</span>
            </span>
          ))}
        </div>

        {/* Fresh Deli Guarantee Badge */}
        {freshDeliGuarantee ? (
          <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/95 text-emerald-800 shadow-sm border border-emerald-100 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ضمانت تازگی دلی</span>
            </span>
          </div>
        ) : null}

        {/* Main image */}
        <img
          src={activeImage}
          alt={title}
          className="w-full h-full object-contain max-h-[380px] transition-transform duration-300 hover:scale-105"
        />
      </div>

      {/* Thumbnail Strip */}
      {displayImages.length > 1 ? (
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none" role="tablist">
          {displayImages.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-2xl border-2 p-1 bg-white overflow-hidden transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isSelected
                    ? 'border-emerald-600 shadow-sm ring-1 ring-emerald-500'
                    : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                }`}
                aria-label={`تصویر بندانگشتی ${toPersianDigits(idx + 1)}`}
              >
                <img
                  src={img}
                  alt={`${title} - تصویر ${toPersianDigits(idx + 1)}`}
                  className="w-full h-full object-contain"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default ProductImageGallery;
