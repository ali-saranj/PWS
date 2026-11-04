'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { toPersianDigits } from '@/lib/format';

export interface PaginationProps {
  currentPage: number; // 0-based
  totalPages: number;
  totalElements?: number;
  pageSize?: number;
  pageUrlPattern?: string; // e.g. "/products?page=__PAGE__"
  createPageUrl?: (page: number) => string;
  onPageChange?: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalElements,
  pageSize = 24,
  pageUrlPattern,
  createPageUrl,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= totalPages - 1;

  // Calculate items summary range
  let startItem = 1;
  let endItem = totalElements ?? 0;
  if (totalElements !== undefined) {
    startItem = currentPage * pageSize + 1;
    endItem = Math.min((currentPage + 1) * pageSize, totalElements);
  }

  // Generate page numbers to display
  const pages: number[] = [];
  const maxButtons = 5;
  let startPage = Math.max(0, currentPage - 2);
  let endPage = Math.min(totalPages - 1, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(0, endPage - maxButtons + 1);
  }
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const getPageUrl = (pageNum: number): string | undefined => {
    if (pageUrlPattern) {
      return pageUrlPattern.replace('__PAGE__', String(pageNum));
    }
    if (createPageUrl) {
      return createPageUrl(pageNum);
    }
    return undefined;
  };

  const renderButtonOrLink = (
    pageNum: number,
    label: string,
    isActive: boolean,
    isDisabled: boolean,
    ariaLabel?: string
  ) => {
    const activeClasses = isActive
      ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20 font-bold'
      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200';
    const disabledClasses = isDisabled
      ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-100 pointer-events-none'
      : '';

    const baseClasses = `min-w-[40px] h-10 px-3 inline-flex items-center justify-center rounded-xl border text-sm font-medium transition-colors ${activeClasses} ${disabledClasses}`;

    const url = getPageUrl(pageNum);

    if (url && !isDisabled) {
      return (
        <Link
          key={`page-${pageNum}-${label}`}
          href={url}
          className={baseClasses}
          aria-label={ariaLabel || label}
          aria-current={isActive ? 'page' : undefined}
        >
          {label}
        </Link>
      );
    }

    return (
      <button
        key={`page-${pageNum}-${label}`}
        type="button"
        disabled={isDisabled}
        onClick={() => onPageChange?.(pageNum)}
        className={baseClasses}
        aria-label={ariaLabel || label}
        aria-current={isActive ? 'page' : undefined}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-gray-100 font-vazirmatn ${className}`}
      dir="rtl"
    >
      {/* Summary */}
      {totalElements !== undefined && (
        <div className="text-xs sm:text-sm text-gray-500 font-medium">
          نمایش {toPersianDigits(startItem)} تا {toPersianDigits(endItem)} از{' '}
          {toPersianDigits(totalElements)} کالا
        </div>
      )}

      {/* Page controls */}
      <nav aria-label="ناوبری صفحات" className="flex items-center gap-1.5">
        {/* Previous Button (in RTL, Right Arrow is previous) */}
        {renderButtonOrLink(
          currentPage - 1,
          'قبلی',
          false,
          isFirstPage,
          'صفحه قبلی'
        )}

        {/* Page Numbers */}
        {pages.map((p) =>
          renderButtonOrLink(p, toPersianDigits(p + 1), p === currentPage, false)
        )}

        {/* Next Button (in RTL, Left Arrow is next) */}
        {renderButtonOrLink(
          currentPage + 1,
          'بعدی',
          false,
          isLastPage,
          'صفحه بعدی'
        )}
      </nav>
    </div>
  );
};

export default Pagination;
