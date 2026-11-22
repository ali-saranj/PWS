'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toPersianDigits, toEnglishDigits } from '@/lib/format';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Phone,
  User,
  Check,
} from 'lucide-react';

export interface Address {
  id: number;
  customerId?: number;
  province: string;
  city: string;
  line: string;
  postalCode: string;
  recipientName: string;
  recipientMobile: string;
  isDefault: boolean;
  createdAt?: string;
}

export default function AddressBookTab() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isDeleting, setIsDeleting] = useState<Address | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [formRecipientName, setFormRecipientName] = useState('');
  const [formRecipientMobile, setFormRecipientMobile] = useState('');
  const [formProvince, setFormProvince] = useState('اصفهان');
  const [formCity, setFormCity] = useState('اصفهان');
  const [formLine, setFormLine] = useState('');
  const [formPostalCode, setFormPostalCode] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<Address[]>('/api/shop/customer/addresses');
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'خطا در دریافت لیست آدرس‌ها.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const openAddModal = () => {
    setEditingAddress(null);
    setFormRecipientName('');
    setFormRecipientMobile('');
    setFormProvince('اصفهان');
    setFormCity('اصفهان');
    setFormLine('');
    setFormPostalCode('');
    setFormIsDefault(addresses.length === 0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setFormRecipientName(addr.recipientName);
    setFormRecipientMobile(toPersianDigits(addr.recipientMobile));
    setFormProvince(addr.province);
    setFormCity(addr.city);
    setFormLine(addr.line);
    setFormPostalCode(toPersianDigits(addr.postalCode));
    setFormIsDefault(addr.isDefault);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = formRecipientName.trim();
    const cleanMobile = toEnglishDigits(formRecipientMobile).trim();
    const cleanLine = formLine.trim();
    const cleanPostal = toEnglishDigits(formPostalCode).replace(/\D/g, '');

    if (!name) {
      setFormError('نام تحویل‌گیرنده را وارد کنید.');
      return;
    }

    if (!/^09\d{9}$/.test(cleanMobile)) {
      setFormError('شماره موبایل تحویل‌گیرنده نامعتبر است.');
      return;
    }

    if (!cleanLine) {
      setFormError('نشانی پستی را وارد کنید.');
      return;
    }

    if (cleanPostal.length !== 10) {
      setFormError('کد پستی باید ۱۰ رقم باشد.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        province: formProvince.trim(),
        city: formCity.trim(),
        line: cleanLine,
        postalCode: cleanPostal,
        recipientName: name,
        recipientMobile: cleanMobile,
        isDefault: formIsDefault,
      };

      if (editingAddress) {
        await api.put(`/api/shop/customer/addresses/${editingAddress.id}`, payload);
      } else {
        await api.post('/api/shop/customer/addresses', payload);
      }

      await fetchAddresses();
      closeModal();
    } catch (err: any) {
      setFormError(err?.data?.message || err?.message || 'خطا در ثبت اطلاعات آدرس.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDefault = async (addrId: number) => {
    setActionLoading(true);
    try {
      await api.put(`/api/shop/customer/addresses/${addrId}/default`);
      await fetchAddresses();
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'خطا در تغییر آدرس پیش‌فرض.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) return;
    setActionLoading(true);
    try {
      await api.delete(`/api/shop/customer/addresses/${isDeleting.id}`);
      setIsDeleting(null);
      await fetchAddresses();
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'خطا در حذف آدرس.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-stone-800">آدرس‌های تحویل</h2>
          <p className="text-sm text-stone-500 mt-1">مدیریت آدرس‌های منتخب جهت ارسال سفارشات.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن آدرس جدید</span>
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchAddresses()}
            className="text-xs text-rose-700 font-semibold underline hover:text-rose-900"
          >
            تلاش مجدد
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div data-testid="address-loading-skeleton" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-32 bg-stone-200 rounded" />
                <div className="h-6 w-16 bg-stone-200 rounded-full" />
              </div>
              <div className="h-4 w-full bg-stone-100 rounded" />
              <div className="h-4 w-2/3 bg-stone-100 rounded" />
              <div className="h-8 w-24 bg-stone-200 rounded mt-4" />
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-100 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-800">هنوز آدرسی ثبت نکرده‌اید</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            برای ثبت آسان‌تر سفارشات بعدی، آدرس پستی و اطلاعات تحویل‌گیرنده خود را اضافه کنید.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن اولین آدرس</span>
          </button>
        </div>
      ) : (
        /* Address Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              data-testid="address-card"
              className={`relative bg-white rounded-2xl p-5 border transition flex flex-col justify-between shadow-sm ${
                addr.isDefault
                  ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                  : 'border-stone-100 hover:border-stone-200'
              }`}
            >
              <div>
                {/* Header: Name, Mobile & Default Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-stone-400" />
                    <span className="font-bold text-stone-800 text-sm">{addr.recipientName}</span>
                  </div>
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      <Check className="w-3.5 h-3.5" />
                      پیش‌فرض
                    </span>
                  )}
                </div>

                {/* Mobile */}
                <div className="flex items-center gap-2 text-stone-500 text-xs mb-3">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span className="font-mono">{toPersianDigits(addr.recipientMobile)}</span>
                </div>

                {/* Address Line */}
                <div className="flex items-start gap-2 text-stone-700 text-sm mb-2">
                  <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="leading-relaxed">
                    <span className="text-stone-500 text-xs block mb-0.5">
                      {addr.province}، {addr.city}
                    </span>
                    {addr.line}
                  </p>
                </div>

                {/* Postal Code */}
                <div className="text-xs text-stone-400 mt-2 pr-6">
                  کد پستی: <span className="font-mono">{toPersianDigits(addr.postalCode)}</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(addr)}
                    className="p-2 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                    title="ویرایش"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>ویرایش</span>
                  </button>
                  <button
                    onClick={() => setIsDeleting(addr)}
                    className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف</span>
                  </button>
                </div>

                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg font-medium transition"
                  >
                    انتخاب به عنوان پیش‌فرض
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-stone-800 text-lg">
                {editingAddress ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Recipient Name & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="form-recipient-name"
                    className="block text-xs font-medium text-stone-700 mb-1.5"
                  >
                    نام و نام خانوادگی تحویل‌گیرنده
                  </label>
                  <input
                    id="form-recipient-name"
                    type="text"
                    value={formRecipientName}
                    onChange={(e) => setFormRecipientName(e.target.value)}
                    placeholder="مثال: علی حسینی"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="form-recipient-mobile"
                    className="block text-xs font-medium text-stone-700 mb-1.5"
                  >
                    شماره موبایل
                  </label>
                  <input
                    id="form-recipient-mobile"
                    type="text"
                    dir="ltr"
                    value={formRecipientMobile}
                    onChange={(e) => setFormRecipientMobile(e.target.value)}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm text-right focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-mono"
                  />
                </div>
              </div>

              {/* Province & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="form-province"
                    className="block text-xs font-medium text-stone-700 mb-1.5"
                  >
                    استان
                  </label>
                  <input
                    id="form-province"
                    type="text"
                    value={formProvince}
                    onChange={(e) => setFormProvince(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="form-city"
                    className="block text-xs font-medium text-stone-700 mb-1.5"
                  >
                    شهر
                  </label>
                  <input
                    id="form-city"
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                </div>
              </div>

              {/* Address Line */}
              <div>
                <label
                  htmlFor="form-line"
                  className="block text-xs font-medium text-stone-700 mb-1.5"
                >
                  نشانی پستی دقیق
                </label>
                <textarea
                  id="form-line"
                  rows={3}
                  value={formLine}
                  onChange={(e) => setFormLine(e.target.value)}
                  placeholder="خیابان، کوچه، پلاک، زنگ، طبقه"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition resize-none"
                />
              </div>

              {/* Postal Code */}
              <div>
                <label
                  htmlFor="form-postal-code"
                  className="block text-xs font-medium text-stone-700 mb-1.5"
                >
                  کد پستی (۱۰ رقم)
                </label>
                <input
                  id="form-postal-code"
                  type="text"
                  dir="ltr"
                  maxLength={10}
                  value={formPostalCode}
                  onChange={(e) => setFormPostalCode(e.target.value)}
                  placeholder="۱۲۳۴۵۶۷۸۹۰"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm text-right focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-mono"
                />
              </div>

              {/* Is Default Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="form-is-default"
                  type="checkbox"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                />
                <label htmlFor="form-is-default" className="text-xs text-stone-700 cursor-pointer select-none">
                  انتخاب به عنوان آدرس پیش‌فرض
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-sm transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingAddress ? (
                    'ذخیره تغییرات'
                  ) : (
                    'ثبت آدرس'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-stone-800 text-lg">حذف آدرس</h3>
              <p className="text-sm text-stone-500">
                آیا از حذف این آدرس اطمینان دارید؟ این عملیات قابل بازگشت نیست.
              </p>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-600 space-y-1">
              <p className="font-medium text-stone-800">{isDeleting.recipientName}</p>
              <p className="truncate">{isDeleting.line}</p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleting(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-sm transition"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'بله، حذف شود'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
