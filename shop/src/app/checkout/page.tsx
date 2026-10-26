'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
  Plus,
  Loader2,
  AlertCircle,
  FileText,
  User,
  Phone,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import { useAuthStore } from '@/lib/authStore';
import { QuickAuthModal } from '@/components/QuickAuthModal';
import { formatToman, toPersianDigits, toEnglishDigits } from '@/lib/format';
import { api } from '@/lib/api';

export interface Address {
  id: number;
  customerId: number;
  province: string;
  city: string;
  line: string;
  postalCode: string;
  recipientName: string;
  recipientMobile: string;
  isDefault: boolean;
  createdAt?: string;
}

interface ShippingMethod {
  id: number;
  nameFa: string;
  descriptionFa?: string;
  cost: number;
  freeOver?: number;
}

const DEFAULT_SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 1,
    nameFa: 'ارسال اکسپرس با پیک شهری',
    descriptionFa: 'تحویل با پیک موتوری / ون عایق در محدوده شهر تهران',
    cost: 45000,
    freeOver: 500000,
  },
];

export default function CheckoutPage() {
  const { items, getTotalToman, getTotalItems } = useCartStore();
  const { customer, isAuthenticated, isLoading: authLoading, checkAuth, logout } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  // New address form state
  const [newProvince, setNewProvince] = useState('تهران');
  const [newCity, setNewCity] = useState('تهران');
  const [newLine, setNewLine] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientMobile, setNewRecipientMobile] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);

  // Shipping & note
  const [selectedShippingId, setSelectedShippingId] = useState<number>(1);
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Check auth on load
  useEffect(() => {
    checkAuth();
  }, []);

  // When customer becomes authenticated, fetch addresses
  const fetchAddresses = async () => {
    setAddressLoading(true);
    try {
      const list = await api.get<Address[]>('/api/shop/customer/addresses');
      if (Array.isArray(list)) {
        setAddresses(list);
        if (list.length > 0) {
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(defaultAddr.id);
        } else {
          setIsAddingAddress(true);
        }
      }
    } catch {
      // silently handle or fallback
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
      if (customer && !newRecipientName) {
        const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ');
        if (fullName) setNewRecipientName(fullName);
      }
      if (customer?.mobile && !newRecipientMobile) {
        setNewRecipientMobile(customer.mobile);
      }
    }
  }, [isAuthenticated, customer]);

  const subtotal = getTotalToman();
  const totalItemsCount = getTotalItems();

  const selectedShipping =
    DEFAULT_SHIPPING_METHODS.find((m) => m.id === selectedShippingId) ||
    DEFAULT_SHIPPING_METHODS[0];

  const effectiveShippingCost =
    selectedShipping.freeOver && subtotal >= selectedShipping.freeOver
      ? 0
      : selectedShipping.cost;

  const finalPayableTotal = subtotal + effectiveShippingCost;

  // Handle saving new address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);

    const cleanMobile = toEnglishDigits(newRecipientMobile).trim();
    const cleanPostal = toEnglishDigits(newPostalCode).trim();

    if (!newRecipientName.trim()) {
      setAddressError('نام تحویل‌گیرنده را وارد کنید.');
      return;
    }
    if (!/^09\d{9}$/.test(cleanMobile)) {
      setAddressError('شماره موبایل تحویل‌گیرنده نامعتبر است.');
      return;
    }
    if (!newLine.trim()) {
      setAddressError('نشانی پستی را وارد کنید.');
      return;
    }
    if (cleanPostal.length !== 10) {
      setAddressError('کد پستی باید ۱۰ رقم باشد.');
      return;
    }

    setAddressLoading(true);
    try {
      const created = await api.post<Address>('/api/shop/customer/addresses', {
        province: newProvince.trim(),
        city: newCity.trim(),
        line: newLine.trim(),
        postalCode: cleanPostal,
        recipientName: newRecipientName.trim(),
        recipientMobile: cleanMobile,
        isDefault: addresses.length === 0,
      });

      setAddresses((prev) => [...prev, created]);
      setSelectedAddressId(created.id);
      setIsAddingAddress(false);
      setNewLine('');
      setNewPostalCode('');
    } catch (err: any) {
      setAddressError(err?.data?.message || 'خطا در ثبت آدرس جدید.');
    } finally {
      setAddressLoading(false);
    }
  };

  // Handle checkout submission
  const handleCheckoutSubmit = async () => {
    if (!selectedAddressId) {
      setCheckoutError('لطفاً آدرس تحویل سفارش را انتخاب یا ثبت کنید.');
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const payload = {
        items: items.map((i) => ({
          variantId: i.variantId,
          qty: i.quantity,
        })),
        addressId: selectedAddressId,
        shippingMethodId: selectedShipping.id,
        customerNote: customerNote,
      };

      const res = await api.post<{
        orderNumber: string;
        trackingCode: string;
        paymentUrl: string;
        authority: string;
      }>('/api/shop/checkout', payload);

      if (res && res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        throw new Error('آدرس درگاه پرداخت دریافت نشد.');
      }
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        'خطا در برقراری ارتباط با درگاه پرداخت یا ثبت سفارش.';
      setCheckoutError(msg);
      setIsSubmitting(false);
    }
  };

  // 1. Empty Cart State
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center font-vazirmatn">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-gray-100 flex items-center justify-center text-gray-400 mb-6">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">
          سبد خرید شما خالی است
        </h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
          برای تکمیل خرید، ابتدا محصولات پروتئینی، کالباس، سوسیس یا کالاهای دلخواه خود را به سبد خرید بیفزایید.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-lg shadow-primary/25 transition-all text-sm"
        >
          <span>مشاهده محصولات</span>
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-vazirmatn text-right">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
          تسویه‌حساب و نهایی‌سازی سفارش
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          اطلاعات تحویل و روش ارسال را تایید کرده و به درگاه پرداخت متصل شوید.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Main Column: Auth or Addresses + Shipping + Notes */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Customer Authentication */}
          {!isAuthenticated ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <QuickAuthModal
                inline
                title="ورود یا ثبت‌نام جهت تکمیل خرید"
                description="برای تکمیل خرید و ثبت آدرس، لطفاً شماره موبایل خود را وارد کنید."
                onSuccess={() => fetchAddresses()}
              />
            </div>
          ) : (
            <>
              {/* Authenticated Customer Bar */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {[customer?.firstName, customer?.lastName].filter(Boolean).join(' ') ||
                        'مشتری گرامی'}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{customer?.mobile ? toPersianDigits(customer.mobile) : ''}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                >
                  خروج از حساب
                </button>
              </div>

              {/* Step 2: Address Selection */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        آدرس تحویل سفارش
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        سفارش به این آدرس ارسال خواهد شد.
                      </p>
                    </div>
                  </div>

                  {!isAddingAddress && addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(true)}
                      className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>افزودن آدرس جدید</span>
                    </button>
                  )}
                </div>

                {/* Address List */}
                {!isAddingAddress && addresses.length > 0 && (
                  <div className="space-y-3">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="selectedAddress"
                                checked={isSelected}
                                onChange={() => setSelectedAddressId(addr.id)}
                                className="mt-1 text-primary focus:ring-primary h-4 w-4"
                              />
                              <div>
                                <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                                  {addr.province}، {addr.city}، {addr.line}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                                  <span>کد پستی: {toPersianDigits(addr.postalCode)}</span>
                                  <span>تحویل‌گیرنده: {addr.recipientName}</span>
                                  <span>تلفن: {toPersianDigits(addr.recipientMobile)}</span>
                                </div>
                              </div>
                            </div>
                            {addr.isDefault && (
                              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                                پیش‌فرض
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add New Address Form */}
                {isAddingAddress && (
                  <form onSubmit={handleSaveAddress} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          استان
                        </label>
                        <input
                          type="text"
                          value={newProvince}
                          onChange={(e) => setNewProvince(e.target.value)}
                          className="w-full text-sm py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          شهر
                        </label>
                        <input
                          type="text"
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          className="w-full text-sm py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        نشانی پستی کامل (خیابان، کوچه، پلاک، واحد)
                      </label>
                      <textarea
                        rows={2}
                        value={newLine}
                        onChange={(e) => setNewLine(e.target.value)}
                        placeholder="مثال: سعادت‌آباد، بلوار شهرداری، پلاک ۱۲، واحد ۳"
                        className="w-full text-sm py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          کد پستی (۱۰ رقمی)
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          value={newPostalCode}
                          onChange={(e) =>
                            setNewPostalCode(toEnglishDigits(e.target.value).replace(/\D/g, ''))
                          }
                          placeholder="۱۲۳۴۵۶۷۸۹۰"
                          dir="ltr"
                          className="w-full text-sm py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          نام تحویل‌گیرنده
                        </label>
                        <input
                          type="text"
                          value={newRecipientName}
                          onChange={(e) => setNewRecipientName(e.target.value)}
                          placeholder="نام و نام خانوادگی"
                          className="w-full text-sm py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          موبایل تحویل‌گیرنده
                        </label>
                        <input
                          type="tel"
                          maxLength={11}
                          value={newRecipientMobile}
                          onChange={(e) =>
                            setNewRecipientMobile(toEnglishDigits(e.target.value).replace(/\D/g, ''))
                          }
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                          dir="ltr"
                          className="w-full text-sm py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    {addressError && (
                      <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                        {addressError}
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={addressLoading}
                        className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl text-xs shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        {addressLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>ثبت و ذخیره آدرس</span>
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsAddingAddress(false)}
                          className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-xs transition-colors"
                        >
                          انصراف
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* Step 3: Shipping Method */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">شیوه ارسال</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      انتخاب روش و زمان ارسال مرسوله
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {DEFAULT_SHIPPING_METHODS.map((method) => {
                    const isSelected = selectedShippingId === method.id;
                    const isFree = method.freeOver && subtotal >= method.freeOver;
                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedShippingId(method.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shippingMethod"
                            checked={isSelected}
                            onChange={() => setSelectedShippingId(method.id)}
                            className="text-primary focus:ring-primary h-4 w-4"
                          />
                          <div>
                            <span className="text-sm font-bold text-gray-900">
                              {method.nameFa}
                            </span>
                            {method.descriptionFa && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {method.descriptionFa}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-left font-bold text-sm">
                          {isFree ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs">
                              رایگان (خرید بالای ۵۰۰,۰۰۰ تومان)
                            </span>
                          ) : (
                            <span className="text-gray-900">
                              {formatToman(method.cost)} تومان
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Customer Order Notes */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>یادداشت سفارش (اختیاری)</span>
                </div>
                <textarea
                  rows={2}
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="توضیحات تکمیلی برای پیک یا آماده‌سازی سفارش (مانند طبقه، زنگ یا هماهنگی تلفنی)..."
                  className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </>
          )}
        </div>

        {/* Right Column: Order Summary & Zarinpal Payment CTA */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5 sticky top-24">
            <h3 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100 flex items-center justify-between">
              <span>خلاصه سفارش</span>
              <span className="text-xs text-primary font-semibold bg-primary/10 px-2.5 py-0.5 rounded-full">
                {toPersianDigits(totalItemsCount)} کالا
              </span>
            </h3>

            {/* Items scroll */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50"
                >
                  <div className="flex-1 min-w-0 pr-1">
                    <span className="font-semibold text-gray-800 block truncate">
                      {item.name}
                    </span>
                    <span className="text-gray-400">
                      {item.variantName} × {toPersianDigits(item.quantity)}
                    </span>
                  </div>
                  <div className="font-bold text-gray-800 whitespace-nowrap">
                    {formatToman(item.priceToman * item.quantity)} تومان
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-3 text-xs pt-2">
              <div className="flex items-center justify-between text-gray-600">
                <span>قیمت کالاها</span>
                <span className="font-semibold text-gray-800">
                  {formatToman(subtotal)} تومان
                </span>
              </div>

              <div className="flex items-center justify-between text-gray-600">
                <span>هزینه ارسال</span>
                <span className="font-semibold">
                  {effectiveShippingCost === 0 ? (
                    <span className="text-emerald-700 font-bold">رایگان</span>
                  ) : (
                    <span>{formatToman(effectiveShippingCost)} تومان</span>
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-sm font-black text-gray-900">
                <span>مبلغ قابل پرداخت</span>
                <span className="text-primary text-base">
                  {formatToman(finalPayableTotal)} تومان
                </span>
              </div>
            </div>

            {/* Error Message */}
            {checkoutError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Payment CTA */}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleCheckoutSubmit}
                disabled={isSubmitting || !selectedAddressId}
                className="w-full py-4 bg-primary hover:bg-primary-dark disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>در حال انتقال به درگاه بانکی...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>پرداخت آنلاین با زرین‌پال</span>
                  </>
                )}
              </button>
            ) : (
              <div className="text-center p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-medium border border-amber-200/60">
                برای پرداخت، ابتدا با شماره موبایل خود وارد شوید.
              </div>
            )}

            {/* Security Guarantee badge */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>پرداخت امن و معتبر از طریق درگاه زرین‌پال (شاپرک)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
