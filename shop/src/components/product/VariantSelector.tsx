'use client';

import React from 'react';
import { Check, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProductVariant } from '@/lib/productDetail';
import { formatToman, toPersianDigits } from '@/lib/format';

export interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: number;
  onSelectVariant: (variant: ProductVariant) => void;
  className?: string;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedVariantId,
  onSelectVariant,
  className = '',
}) => {
  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) || variants[0];

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-gray-800">
          انتخاب وزن و نوع برش:
        </label>
        {selectedVariant ? (
          <span className="text-xs text-gray-500 font-medium">
            وزن: {selectedVariant.weightLabel}
          </span>
        ) : null}
      </div>

      {/* Variant Pills / Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" role="radiogroup" aria-label="انتخاب نوع برش و وزن">
        {variants.map((v) => {
          const isSelected = v.id === selectedVariantId;
          const isAvailable = v.inStock && (v.stock === undefined || v.stock > 0);

          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={!isAvailable}
              onClick={() => onSelectVariant(v)}
              className={`relative flex flex-col items-start p-3 rounded-xl border text-right transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500'
                  : isAvailable
                  ? 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                  : 'border-gray-200 bg-gray-50/70 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`text-sm font-bold ${
                    isSelected ? 'text-emerald-900' : 'text-gray-800'
                  }`}
                >
                  {v.nameFa}
                </span>
                {isSelected ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                ) : null}
              </div>

              <div className="flex items-baseline gap-1 mt-1">
                <span
                  className={`text-xs font-black ${
                    isSelected ? 'text-emerald-700' : 'text-gray-700'
                  }`}
                >
                  {formatToman(v.priceToman)}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">تومان</span>
              </div>

              {!isAvailable ? (
                <span className="mt-1 text-[11px] text-rose-500 font-medium">
                  ناموجود
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Active variant stock indicator */}
      {selectedVariant ? (
        <div className="flex items-center gap-1.5 pt-1 text-xs">
          {selectedVariant.inStock && (selectedVariant.stock === undefined || selectedVariant.stock > 0) ? (
            <div className="flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>موجود در انبار</span>
              {selectedVariant.stock ? (
                <span className="text-gray-500 font-normal">
                  ({toPersianDigits(selectedVariant.stock)} عدد آماده تحویل)
                </span>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-rose-600 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>ناموجود در انبار</span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default VariantSelector;
