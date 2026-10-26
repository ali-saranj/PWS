'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export type SortOptionKey = 'newest' | 'popular' | 'price_asc' | 'price_desc';

export interface SortDropdownProps {
  value: SortOptionKey | string;
  onChange: (value: SortOptionKey) => void;
  className?: string;
}

export const SORT_OPTIONS: { id: SortOptionKey; label: string }[] = [
  { id: 'newest', label: 'جدیدترین' },
  { id: 'popular', label: 'پرفروش‌ترین' },
  { id: 'price_asc', label: 'ارزان‌ترین' },
  { id: 'price_desc', label: 'گران‌ترین' },
];

export const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label
        htmlFor="sort-select"
        className="text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap flex items-center gap-1.5"
      >
        <ArrowUpDown className="w-4 h-4 text-gray-400" />
        <span>مرتب‌سازی:</span>
      </label>
      <div className="relative">
        <select
          id="sort-select"
          aria-label="مرتب‌سازی"
          value={value}
          onChange={(e) => onChange(e.target.value as SortOptionKey)}
          className="appearance-none bg-white border border-gray-200 text-gray-800 text-xs sm:text-sm font-semibold rounded-xl py-2 pl-8 pr-3 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2.5 text-gray-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
              fillRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SortDropdown;
