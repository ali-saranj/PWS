'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Plus, Check, Percent } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import { formatToman, toPersianDigits } from '@/lib/format';

export interface ProductData {
  id: number;
  slug: string;
  nameFa: string;
  nameEn?: string;
  brandNameFa?: string;
  brandId?: number;
  categoryNameFa?: string;
  categoryId?: number;
  categorySlug?: string;
  thumbnailUrl?: string;
  priceToman: number;
  compareAtPriceToman?: number | null;
  discountPercent?: number | null;
  portionLabel?: string;
  weightLabel?: string;
  inStock?: boolean;
  totalStock?: number;
  unit?: string;
  badges?: string[];
  defaultVariantId?: number;
  variantId?: number;
  rating?: number;
}

export interface ProductCardProps extends Partial<ProductData> {
  product?: ProductData;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = (props) => {
  const item: ProductData = props.product
    ? { ...props.product, ...props }
    : (props as ProductData);

  const {
    id = 0,
    slug = '',
    nameFa = '',
    brandNameFa,
    brandId,
    thumbnailUrl,
    priceToman = 0,
    compareAtPriceToman,
    portionLabel,
    weightLabel,
    inStock = true,
    totalStock,
    unit,
  } = item;

  const displayPortion = portionLabel || weightLabel || '';
  const calculatedDiscount =
    item.discountPercent ??
    (compareAtPriceToman && compareAtPriceToman > priceToman
      ? Math.round(((compareAtPriceToman - priceToman) / compareAtPriceToman) * 100)
      : null);

  const hasDiscount = Boolean(calculatedDiscount && calculatedDiscount > 0);
  const addItem = useCartStore((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!inStock) return;

    const effectiveVariantId = item.defaultVariantId || item.variantId || id;

    addItem({
      id: `product-${id}-variant-${effectiveVariantId}`,
      productId: id,
      variantId: effectiveVariantId,
      name: nameFa,
      variantName: displayPortion || 'بسته استاندارد',
      priceToman,
      imageUrl: thumbnailUrl,
      unit: unit || displayPortion,
      maxStock: totalStock ?? 99,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <div
      className={`group relative bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden ${
        props.className || ''
      }`}
      data-testid={`product-card-${id}`}
    >
      {/* Top badges / discount */}
      <div className="absolute top-3 right-3 left-3 flex items-center justify-between z-10 pointer-events-none">
        {hasDiscount ? (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white shadow-sm">
            <span>٪</span>
            <span>{toPersianDigits(calculatedDiscount!)}</span>
          </span>
        ) : (
          <span />
        )}

        {inStock ? (
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
            موجود
          </span>
        ) : (
          <span className="text-[11px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
            ناموجود
          </span>
        )}
      </div>

      {/* Product Image & Link */}
      <Link
        href={`/product/${slug || id}`}
        className="block relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3 mt-4 focus:outline-none"
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={nameFa}
            className={`w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300 ${
              !inStock ? 'opacity-40 grayscale' : ''
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              ناموجود
            </span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Portion */}
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            {brandNameFa ? (
              brandId ? (
                <Link
                  href={`/products?brandId=${brandId}`}
                  className="font-medium text-gray-500 hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {brandNameFa}
                </Link>
              ) : (
                <span className="font-medium text-gray-500">{brandNameFa}</span>
              )
            ) : (
              <span />
            )}
            {displayPortion ? (
              <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[11px]">
                {displayPortion}
              </span>
            ) : null}
          </div>

          {/* Title in Persian */}
          <Link
            href={`/product/${slug || id}`}
            className="block focus:outline-none group-hover:text-primary transition-colors"
          >
            <h3 className="font-bold text-sm sm:text-base text-gray-800 line-clamp-2 leading-snug min-h-[2.5rem]">
              {nameFa}
            </h3>
          </Link>
        </div>

        {/* Price & Action Button */}
        <div className="mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-end justify-between gap-2 mb-2.5">
            <div className="flex flex-col">
              {hasDiscount && compareAtPriceToman ? (
                <span className="line-through text-xs text-gray-400 font-medium">
                  {formatToman(compareAtPriceToman)}
                </span>
              ) : null}
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-black text-gray-900">
                  {formatToman(priceToman)}
                </span>
                <span className="text-xs text-gray-500 font-medium">تومان</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={!inStock}
            onClick={handleAddToCart}
            aria-label={
              !inStock
                ? 'کالای ناموجود'
                : isAdded
                ? 'به سبد اضافه شد'
                : 'افزودن به سبد'
            }
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              !inStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : isAdded
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-primary hover:bg-primary-dark text-white shadow-primary/20 hover:shadow active:scale-[0.98]'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>افزوده شد</span>
              </>
            ) : !inStock ? (
              <span>ناموجود</span>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>افزودن به سبد</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
