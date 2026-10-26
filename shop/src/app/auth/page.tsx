'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QuickAuthModal } from '@/components/QuickAuthModal';
import { useAuthStore } from '@/lib/authStore';
import { User, LogOut, Package, MapPin } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const { customer, isAuthenticated, logout, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isAuthenticated && customer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 font-vazirmatn">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {customer.firstName || customer.lastName
              ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim()
              : 'مشتری گرامی'}
          </h1>
          <p className="text-gray-500 text-sm mb-8" dir="ltr">
            {customer.mobile}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <Link
              href="/track"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-800 text-sm font-semibold transition-colors"
            >
              <Package className="w-4 h-4 text-primary" />
              <span>پیگیری سفارش‌ها</span>
            </Link>

            <Link
              href="/checkout"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>ثبت آدرس و تسویه‌حساب</span>
            </Link>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center justify-center gap-2 mx-auto text-sm text-rose-600 hover:text-rose-700 font-medium py-2 px-4 rounded-xl hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از حساب کاربری</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 font-vazirmatn">
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <QuickAuthModal
          onSuccess={() => {
            router.push('/');
          }}
        />
      </div>
    </div>
  );
}
