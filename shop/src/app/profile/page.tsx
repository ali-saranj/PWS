'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Package,
  MapPin,
  LogOut,
  CheckCircle2,
  Mail,
  LogIn,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { toPersianDigits } from '@/lib/format';
import QuickAuthModal from '@/components/QuickAuthModal';
import OrdersTab from '@/components/profile/OrdersTab';
import AddressBookTab from '@/components/profile/AddressBookTab';
import PersonalInfoTab from '@/components/profile/PersonalInfoTab';

type TabKey = 'orders' | 'addresses' | 'personal';

export default function ProfilePage() {
  const { customer, isAuthenticated, isLoading, checkAuth, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('orders');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Loading state while checking auth
  if (isLoading && !customer) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center items-center min-h-[400px] font-vazirmatn">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-medium">در حال بارگذاری اطلاعات حساب...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated prompt card
  if (!isAuthenticated || !customer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 font-vazirmatn">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5 shadow-inner">
            <User className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            ورود به حساب کاربری
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            برای مشاهده سفارش‌ها و مدیریت حساب خود، لطفاً وارد شوید.
          </p>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-md shadow-primary/25 transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>ورود یا ثبت‌نام</span>
          </button>
        </div>

        <QuickAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => setIsAuthModalOpen(false)}
        />
      </div>
    );
  }

  const fullName =
    customer.firstName || customer.lastName
      ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim()
      : 'مشتری گرامی';

  const initialLetter = customer.firstName
    ? customer.firstName.charAt(0)
    : customer.lastName
    ? customer.lastName.charAt(0)
    : null;

  const tabs = [
    { id: 'orders' as const, label: 'سفارش‌های من', icon: Package },
    { id: 'addresses' as const, label: 'آدرس‌های تحویل', icon: MapPin },
    { id: 'personal' as const, label: 'اطلاعات حساب', icon: User },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-vazirmatn">
      {/* Top Customer Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-black text-2xl shadow-md shadow-primary/20 flex-shrink-0">
              {initialLetter ? initialLetter : <User className="w-8 h-8" />}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                {fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span dir="ltr">{toPersianDigits(customer.mobile)}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-full text-xs font-medium">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span dir="ltr">{customer.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors text-xs sm:text-sm font-semibold self-stretch sm:self-auto justify-center"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از حساب</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/80 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'addresses' && <AddressBookTab />}
        {activeTab === 'personal' && <PersonalInfoTab />}
      </div>
    </div>
  );
}
