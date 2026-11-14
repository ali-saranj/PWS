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
  Tag,
  ShieldCheck,
  PackageCheck,
  PhoneCall,
  Info,
} from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import { useAuthStore } from '@/lib/authStore';
import { formatToman, toPersianDigits } from '@/lib/format';
import { CartDrawer } from './CartDrawer';

export const Header: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const items = useCartStore((state) => state.items);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const customer = useAuthStore((state) => state.customer);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 md:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Mobile Menu Button [☰] */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-1.5 sm:p-2 rounded-xl text-gray-700 hover:bg-gray-100 focus:outline-none flex-shrink-0"
            aria-label="منوی سایت"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Brand Logo & Name */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 text-decoration-none group flex-shrink-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col">
              <span
                data-testid="brand-title-mobile"
                className="font-black text-base sm:text-lg text-gray-900 group-hover:text-primary transition-colors md:hidden"
              >
                سبد سبز
              </span>
              <span
                data-testid="brand-title-desktop"
                className="font-black text-xl text-gray-900 group-hover:text-primary transition-colors hidden md:inline"
              >
                سبد سبز - سوپرمارکت آنلاین
              </span>
              <span className="text-xs text-gray-400 font-medium hidden lg:inline">
                پروتئینی، سوسیس و کالباس، و کالاهای تازه
              </span>
            </div>
          </Link>

          {/* Inline Search Bar (Single Row for Mobile and Desktop) */}
          <div className="flex-1 max-w-2xl mx-1 sm:mx-4">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در سبد سبز..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 md:py-2.5 pr-3 md:pr-4 pl-8 md:pl-28 text-xs md:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button
                type="submit"
                aria-label="جستجو"
                className="absolute left-1 top-1 bottom-1 px-2.5 md:px-4 bg-primary hover:bg-primary-dark text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-sm transition-colors"
              >
                <Search className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden md:inline">جستجو</span>
              </button>
            </form>
          </div>

          {/* Desktop User actions: Login & Cart */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {/* Customer Auth Button */}
            <Link
              href="/profile"
              className="flex items-center gap-2 py-2 px-3.5 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 text-gray-700 hover:text-primary transition-colors text-sm font-medium"
            >
              <User className="w-4 h-4 text-gray-500" />
              <span>
                {mounted && isAuthenticated && customer
                  ? customer.firstName || 'حساب کاربری'
                  : 'ورود / ثبت نام'}
              </span>
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
              <span>سبد خرید</span>
              {totalItems > 0 && (
                <div className="hidden lg:flex items-center gap-1 pr-2 border-r border-white/30 text-xs">
                  <span>{formatToman(totalToman)}</span>
                  <span>تومان</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Bar (Desktop only) */}
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

      {/* Mobile Slide-Over Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          data-testid="mobile-drawer"
          className="fixed inset-0 z-50 md:hidden overflow-hidden"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content - Anchored strictly to the right */}
          <div className="fixed inset-y-0 right-0 w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in-right">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <span className="font-bold text-gray-900 text-sm">
                  منوی سبد سبز
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                aria-label="بستن منو"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Greeting Card in Drawer */}
            <div className="p-4 bg-primary/5 border-b border-gray-100">
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 text-right"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {mounted && isAuthenticated && customer
                      ? customer.firstName || 'حساب کاربری'
                      : 'ورود یا ثبت‌نام'}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {mounted && isAuthenticated && customer
                      ? customer.mobile
                      : 'برای پیگیری سفارش و امتیاز خرید'}
                  </div>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <Store className="w-4 h-4 text-gray-400" />
                <span>صفحه اصلی</span>
              </Link>
              <Link
                href="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <PackageCheck className="w-4 h-4 text-gray-400" />
                <span>همه محصولات</span>
              </Link>
              <Link
                href="/discounts"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <Tag className="w-4 h-4 text-discount" />
                <span>تخفیف‌ها و پیشنهادات</span>
              </Link>
              <Link
                href="/brands"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-gray-400" />
                <span>برندها و تولیدکنندگان</span>
              </Link>
              <Link
                href="/track"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                <span>پیگیری سفارش</span>
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <Info className="w-4 h-4 text-gray-400" />
                <span>درباره ما</span>
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-gray-400" />
                <span>تماس با ما</span>
              </Link>
            </div>

            {/* City delivery badge */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/60 rounded-xl px-3 py-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span>تهران - ارسال سریع با بسته‌بندی عایق</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Cart Drawer */}
      <CartDrawer />
    </header>
  );
};

export default Header;
