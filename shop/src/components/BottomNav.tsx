'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import { useAuthStore } from '@/lib/authStore';
import { toPersianDigits } from '@/lib/format';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const items = useCartStore((state) => state.items);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const customer = useAuthStore((state) => state.customer);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const isHomeActive = pathname === '/';
  const isCategoriesActive =
    pathname === '/categories' || pathname.startsWith('/category/');
  const isProfileActive =
    pathname === '/profile' || pathname.startsWith('/auth');

  return (
    <nav
      aria-label="ناوبری اصلی موبایل"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden pb-[env(safe-area-inset-bottom)] font-vazirmatn transition-all"
    >
      <div className="grid grid-cols-4 h-16 max-w-lg mx-auto px-2">
        {/* Home Tab */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-1 transition-colors text-xs font-medium ${
            isHomeActive
              ? 'text-primary font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
          aria-label="خانه"
        >
          <Home className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px]">خانه</span>
        </Link>

        {/* Categories Tab */}
        <Link
          href="/categories"
          className={`flex flex-col items-center justify-center gap-1 transition-colors text-xs font-medium ${
            isCategoriesActive
              ? 'text-primary font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
          aria-label="دسته‌بندی‌ها"
        >
          <LayoutGrid
            className={`w-5 h-5 ${isCategoriesActive ? 'stroke-[2.5]' : ''}`}
          />
          <span className="text-[11px]">دسته‌بندی‌ها</span>
        </Link>

        {/* Cart Tab */}
        <button
          type="button"
          onClick={toggleCart}
          className="flex flex-col items-center justify-center gap-1 transition-colors text-xs font-medium text-gray-500 hover:text-gray-900 relative"
          aria-label="سبد خرید"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {mounted && totalItems > 0 && (
              <span
                data-testid="bottom-cart-badge"
                className="absolute -top-1.5 -right-2.5 bg-discount text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none shadow-sm animate-in zoom-in-50"
              >
                {toPersianDigits(totalItems)}
              </span>
            )}
            {!mounted && totalItems > 0 && (
              <span
                data-testid="bottom-cart-badge"
                className="absolute -top-1.5 -right-2.5 bg-discount text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none shadow-sm"
              >
                {toPersianDigits(totalItems)}
              </span>
            )}
          </div>
          <span className="text-[11px]">سبد خرید</span>
        </button>

        {/* Profile Tab */}
        <Link
          href="/profile"
          className={`flex flex-col items-center justify-center gap-1 transition-colors text-xs font-medium ${
            isProfileActive
              ? 'text-primary font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
          aria-label="پروفایل / حساب کاربری"
        >
          <User
            className={`w-5 h-5 ${isProfileActive ? 'stroke-[2.5]' : ''}`}
          />
          <span className="text-[11px] truncate max-w-[70px]">
            {mounted && isAuthenticated && customer
              ? customer.firstName || 'پروفایل'
              : 'حساب کاربری'}
          </span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
