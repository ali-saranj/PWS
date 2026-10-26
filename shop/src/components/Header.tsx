'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  User,
  MapPin,
  Menu,
  X,
  Store,
  ChevronDown,
} from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import { formatToman, toPersianDigits } from '@/lib/format';

export const Header: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const items = useCartStore((state) => state.items);
  const toggleCart = useCartStore((state) => state.toggleCart);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalToman = items.reduce(
    (sum, item) => sum + item.priceToman * item.quantity,
    0
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        router?.push?.(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      } catch {
        window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      }
    }
  };

  const navLinks = [
    { label: 'صفحه اصلی', href: '/' },
    { label: 'محصولات', href: '/products' },
    { label: 'تخفیف‌ها', href: '/discounts' },
    { label: 'برندها', href: '/brands' },
    { label: 'دسته‌بندی‌ها', href: '/categories' },
    { label: 'درباره ما', href: '/about' },
    { label: 'تماس با ما', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm font-vazirmatn">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-decoration-none group flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl text-gray-900 group-hover:text-primary transition-colors">
                سبد سبز - سوپرمارکت آنلاین
              </span>
              <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                پروتئینی، سوسیس و کالباس، و کالاهای تازه
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی محصول، برند یا دسته‌بندی..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pr-4 pl-28 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button
                type="submit"
                aria-label="جستجو"
                className="absolute left-1 top-1 bottom-1 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-sm transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>جستجو</span>
              </button>
            </form>
          </div>

          {/* User actions: Login & Cart */}
          <div className="flex items-center gap-3">
            {/* Customer Auth Button */}
            <Link
              href="/auth"
              className="flex items-center gap-2 py-2 px-3.5 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 text-gray-700 hover:text-primary transition-colors text-sm font-medium"
            >
              <User className="w-4 h-4 text-gray-500" />
              <span>ورود / ثبت نام</span>
            </Link>

            {/* Cart Pill Button */}
            <button
              type="button"
              onClick={toggleCart}
              className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/25 transition-all text-sm font-semibold relative"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4" />
                <span
                  data-testid="cart-badge"
                  className="absolute -top-2 -right-2 bg-discount text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none shadow-sm"
                >
                  {toPersianDigits(totalItems)}
                </span>
              </div>
              <span className="hidden sm:inline">سبد خرید</span>
              {totalItems > 0 && (
                <div className="hidden lg:flex items-center gap-1 pr-2 border-r border-white/30 text-xs">
                  <span>{formatToman(totalToman)}</span>
                  <span>تومان</span>
                </div>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
              aria-label="منوی سایت"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی محصول، برند یا دسته‌بندی..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pr-4 pl-24 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              type="submit"
              aria-label="جستجو"
              className="absolute left-1 top-1 bottom-1 px-3 bg-primary text-white rounded-lg flex items-center gap-1 text-xs font-semibold"
            >
              <Search className="w-3.5 h-3.5" />
              <span>جستجو</span>
            </button>
          </form>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="bg-gray-50/80 border-t border-gray-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-11 text-xs">
            {/* Nav Links */}
            <nav className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-600 hover:text-primary font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* City Delivery Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/70 rounded-full font-medium">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>تهران - ارسال سریع</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm text-gray-700 hover:text-primary font-medium"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-emerald-800">
            <MapPin className="w-4 h-4 text-primary" />
            <span>تهران - ارسال سریع</span>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
