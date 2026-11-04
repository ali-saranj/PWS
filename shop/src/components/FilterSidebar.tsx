'use client';

import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, Check, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { formatToman, toPersianDigits, toLatinDigits } from '@/lib/format';
import { DEFAULT_CATEGORIES, CategoryItem } from './home/CategoryCircles';

export interface FilterState {
  categoryId?: number | string | null;
  brandId?: number | null;
  brands?: string[];
  inStockOnly: boolean;
  onSaleOnly: boolean;
  minPrice?: number | null;
  maxPrice?: number | null;
}

export interface BrandFilterItem {
  id: number;
  nameFa: string;
  nameEn?: string;
  slug?: string;
}

export const DEFAULT_BRANDS: string[] = [
  'آندره',
  'سولیکو',
  'کاله',
  '۲۰۲',
  'بیژن',
  'نان‌آوران',
  'میکائیلیان',
  'رباط',
  'بدر',
];

export interface FilterSidebarProps {
  categories?: CategoryItem[];
  availableBrands?: (string | BrandFilterItem)[];
  brands?: (string | BrandFilterItem)[];
  values: FilterState;
  onChange: (newValues: FilterState) => void;
  onReset?: () => void;
  className?: string;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories = DEFAULT_CATEGORIES,
  availableBrands,
  brands,
  values,
  onChange,
  onReset,
  className = '',
}) => {
  const brandList: (string | BrandFilterItem)[] = brands || availableBrands || DEFAULT_BRANDS;

  const [minPriceInput, setMinPriceInput] = useState(
    values.minPrice !== null && values.minPrice !== undefined ? String(values.minPrice) : ''
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    values.maxPrice !== null && values.maxPrice !== undefined ? String(values.maxPrice) : ''
  );

  useEffect(() => {
    setMinPriceInput(
      values.minPrice !== null && values.minPrice !== undefined ? String(values.minPrice) : ''
    );
    setMaxPriceInput(
      values.maxPrice !== null && values.maxPrice !== undefined ? String(values.maxPrice) : ''
    );
  }, [values.minPrice, values.maxPrice]);

  const handleCategorySelect = (catTarget: string | number | null) => {
    const isCurrent =
      values.categoryId !== null &&
      values.categoryId !== undefined &&
      (values.categoryId === catTarget || String(values.categoryId) === String(catTarget));
    onChange({
      ...values,
      categoryId: isCurrent ? null : catTarget,
    });
  };

  const isBrandSelected = (b: string | BrandFilterItem): boolean => {
    if (typeof b === 'object' && b !== null) {
      if (values.brandId !== undefined && values.brandId !== null) {
        return values.brandId === b.id;
      }
      if (values.brands && values.brands.length > 0) {
        return (
          values.brands.includes(b.nameFa) || (b.slug ? values.brands.includes(b.slug) : false)
        );
      }
      return false;
    }
    const currentBrands = values.brands || [];
    return currentBrands.includes(b);
  };

  const handleBrandToggle = (b: string | BrandFilterItem) => {
    if (typeof b === 'object' && b !== null) {
      const isCurrent = values.brandId === b.id;
      onChange({
        ...values,
        brandId: isCurrent ? null : b.id,
        brands: isCurrent ? [] : [b.nameFa],
      });
    } else {
      const currentBrands = values.brands || [];
      const nextBrands = currentBrands.includes(b)
        ? currentBrands.filter((item) => item !== b)
        : [...currentBrands, b];
      onChange({
        ...values,
        brands: nextBrands,
      });
    }
  };

  const handleInStockToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...values,
      inStockOnly: e.target.checked,
    });
  };

  const handleOnSaleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...values,
      onSaleOnly: e.target.checked,
    });
  };

  const parsePrice = (valStr: string): number | null => {
    if (!valStr || !valStr.trim()) return null;
    const latin = toLatinDigits(valStr).replace(/\D/g, '');
    if (!latin) return null;
    const n = parseInt(latin, 10);
    return Number.isFinite(n) ? n : null;
  };

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = parsePrice(minPriceInput);
    const maxVal = parsePrice(maxPriceInput);
    onChange({
      ...values,
      minPrice: minVal,
      maxPrice: maxVal,
    });
  };

  const handleReset = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    if (onReset) {
      onReset();
    } else {
      onChange({
        categoryId: null,
        brandId: null,
        brands: [],
        inStockOnly: false,
        onSaleOnly: false,
        minPrice: null,
        maxPrice: null,
      });
    }
  };

  const hasBrandFilter = Boolean(values.brandId || (values.brands && values.brands.length > 0));
  const activeFiltersCount =
    (values.categoryId ? 1 : 0) +
    (hasBrandFilter ? (values.brandId ? 1 : values.brands?.length || 0) : 0) +
    (values.inStockOnly ? 1 : 0) +
    (values.onSaleOnly ? 1 : 0) +
    (values.minPrice ? 1 : 0) +
    (values.maxPrice ? 1 : 0);

  return (
    <aside
      className={`bg-white border border-gray-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-6 ${className}`}
      aria-label="فیلترهای کاتالوگ"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-gray-900 text-base">فیلترها</h2>
          {activeFiltersCount > 0 && (
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
              {toPersianDigits(activeFiltersCount)}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>حذف فیلترها</span>
          </button>
        )}
      </div>

      {/* Quick Toggles */}
      <div className="space-y-3 pb-4 border-b border-gray-100">
        {/* In-Stock Toggle */}
        <label
          htmlFor="filter-in-stock"
          className="flex items-center justify-between cursor-pointer select-none group"
        >
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            فقط کالاهای موجود
          </span>
          <div className="relative inline-flex items-center">
            <input
              type="checkbox"
              id="filter-in-stock"
              checked={values.inStockOnly}
              onChange={handleInStockToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </div>
        </label>

        {/* On-Sale Toggle */}
        <label
          htmlFor="filter-on-sale"
          className="flex items-center justify-between cursor-pointer select-none group"
        >
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            فقط تخفیف‌دار
          </span>
          <div className="relative inline-flex items-center">
            <input
              type="checkbox"
              id="filter-on-sale"
              checked={values.onSaleOnly}
              onChange={handleOnSaleToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
          </div>
        </label>
      </div>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <div className="space-y-3 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-sm text-gray-900">دسته‌بندی</h3>
          <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {categories.map((cat) => {
              const catTarget =
                cat.id !== undefined && cat.id !== null ? cat.id : cat.slug || String(cat.id);
              const catKey = cat.slug || String(cat.id);
              const isSelected =
                values.categoryId !== null &&
                values.categoryId !== undefined &&
                (values.categoryId === catTarget ||
                  String(values.categoryId) === String(catTarget) ||
                  (cat.id !== undefined && String(values.categoryId) === String(cat.id)) ||
                  (cat.slug && String(values.categoryId) === cat.slug));

              return (
                <li key={catKey}>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(catTarget)}
                    className={`w-full text-right text-xs sm:text-sm py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary text-white font-bold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{cat.nameFa}</span>
                    {isSelected && <Check className="w-4 h-4 stroke-[2.5]" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Brands */}
      {brandList && brandList.length > 0 && (
        <div className="space-y-3 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-sm text-gray-900">برندها</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {brandList.map((brandItem, idx) => {
              const isObj = typeof brandItem === 'object' && brandItem !== null;
              const key = isObj ? `brand-${brandItem.id}` : `brand-${brandItem}-${idx}`;
              const label = isObj ? brandItem.nameFa : brandItem;
              const checked = isBrandSelected(brandItem);

              return (
                <label
                  key={key}
                  className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-700 hover:text-gray-900 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleBrandToggle(brandItem)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary"
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range Filter */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-gray-900">محدوده قیمت (تومان)</h3>
        <form onSubmit={handleApplyPrice} className="space-y-2.5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="از مثلا ۲۰,۰۰۰"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-gray-800"
            />
            <span className="text-xs text-gray-400">تا</span>
            <input
              type="text"
              placeholder="تا مثلا ۳۰۰,۰۰۰"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-gray-800"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors"
          >
            اعمال محدوده قیمت
          </button>
        </form>
      </div>
    </aside>
  );
};

export default FilterSidebar;
