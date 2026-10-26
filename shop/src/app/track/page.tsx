'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, PackageCheck, AlertCircle, ShieldCheck } from 'lucide-react';

export default function TrackLookupPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      setError('لطفاً کد پیگیری سفارش را وارد کنید.');
      return;
    }
    setError(null);
    router.push(`/track/${encodeURIComponent(cleanCode)}`);
  };

  return (
    <div className="max-w-xl mx-auto my-12 px-4">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-sm text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <PackageCheck className="w-9 h-9" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">
          پیگیری سفارش سبد سبز
        </h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          برای اطلاع از آخرین وضعیت آماده‌سازی، برش و ارسال سفارش خود، کد پیگیری پیامک شده را در کادر زیر
          وارد نمایید.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError(null);
              }}
              placeholder="کد پیگیری را وارد کنید... (مثلاً TRK-123456)"
              className="w-full px-4 py-3.5 pl-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono text-center placeholder:font-vazirmatn placeholder:text-gray-400"
              dir="ltr"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 text-right pr-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <PackageCheck className="w-4 h-4" />
            رهگیری سفارش
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>رهگیری امن و زنده بدون نیاز به ورود به حساب کاربری</span>
        </div>
      </div>
    </div>
  );
}
