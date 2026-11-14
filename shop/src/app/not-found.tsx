import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center font-vazirmatn">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
        <ShoppingBag className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-2">۴۰۴</h1>
      <h2 className="text-lg font-bold text-gray-800 mb-4">صفحه مورد نظر یافت نشد</h2>
      <p className="text-gray-500 text-sm mb-8 leading-relaxed">
        ممکن است آدرس وارد شده تغییر کرده باشد یا صفحه حذف شده باشد.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-md shadow-primary/20 transition-colors"
      >
        بازگشت به صفحه اصلی پروتئین ایرانی
      </Link>
    </div>
  );
}
