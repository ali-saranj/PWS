'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api';
import { toPersianDigits } from '@/lib/format';
import { CheckCircle2, AlertCircle, Loader2, Phone, Mail, User } from 'lucide-react';

export default function PersonalInfoTab() {
  const { customer, setCustomer } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setFirstName(customer.firstName || '');
      setLastName(customer.lastName || '');
      setEmail(customer.email || '');
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('فرمت ایمیل نامعتبر است.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        email: trimmedEmail || null,
      };

      const updated = await api.put<{
        id: number;
        mobile: string;
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
      }>('/api/shop/customer/profile', payload);

      if (customer) {
        setCustomer({
          ...customer,
          firstName: updated.firstName ?? payload.firstName,
          lastName: updated.lastName ?? payload.lastName,
          email: updated.email ?? payload.email,
        });
      }

      setSuccessMessage('اطلاعات با موفقیت ذخیره شد.');
    } catch (err: any) {
      const msg =
        err?.data?.message || err?.message || 'خطا در ذخیره اطلاعات. لطفا دوباره تلاش کنید.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const mobileDisplay = customer?.mobile ? toPersianDigits(customer.mobile) : '';

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-100 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-stone-800">اطلاعات حساب کاربری</h2>
        <p className="text-sm text-stone-500 mt-1">مشخصات فردی و اطلاعات تماس خود را مدیریت کنید.</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-6">
        {/* Mobile Number - Read-only with verified badge */}
        <div>
          <label htmlFor="mobile-input" className="block text-sm font-medium text-stone-700 mb-2">
            شماره موبایل
          </label>
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
              <Phone className="w-5 h-5" />
            </div>
            <input
              id="mobile-input"
              type="text"
              readOnly
              disabled
              value={mobileDisplay}
              className="w-full pr-11 pl-28 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-600 text-sm font-mono cursor-not-allowed select-none"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                تأیید شده
              </span>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-1.5">
            شماره موبایل به عنوان نام کاربری شما در نظر گرفته شده و غیرقابل تغییر است.
          </p>
        </div>

        {/* First Name & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first-name-input" className="block text-sm font-medium text-stone-700 mb-2">
              نام
            </label>
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
                <User className="w-5 h-5" />
              </div>
              <input
                id="first-name-input"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="مثال: علی"
                className="w-full pr-11 pl-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="last-name-input" className="block text-sm font-medium text-stone-700 mb-2">
              نام خانوادگی
            </label>
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
                <User className="w-5 h-5" />
              </div>
              <input
                id="last-name-input"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="مثال: محمدی"
                className="w-full pr-11 pl-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email-input" className="block text-sm font-medium text-stone-700 mb-2">
            ایمیل <span className="text-stone-400 font-normal">(اختیاری)</span>
          </label>
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              id="email-input"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
              className="w-full pr-11 pl-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition text-left"
            />
          </div>
          <p className="text-xs text-stone-400 mt-1.5">
            جهت ارسال فاکتور و اطلاعات رهگیری سفارشات.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال ذخیره...</span>
              </>
            ) : (
              <span>ذخیره تغییرات</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
