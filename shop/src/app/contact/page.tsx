import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { BRAND } from '@/config/branding';

export const metadata: Metadata = {
  title: `تماس با ما | ${BRAND.nameFa}`,
  description: `اطلاعات تماس، تلفن پشتیبانی و آدرس فروشگاه اینترنتی فرآورده‌های پروتئینی ${BRAND.nameFa}.`,
  alternates: {
    canonical: `${BRAND.domain}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-vazirmatn">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          صفحه اصلی
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">تماس با ما</span>
      </nav>

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-sm">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
          ارتباط با پشتیبانی {BRAND.nameFa}
        </h1>
        <p className="text-gray-600 mb-8 text-sm">
          همکاران ما در واحد پشتیبانی و ثبت سفارش‌ها هفت روز هفته آماده پاسخگویی به شما هستند.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">شماره تماس پشتیبانی</span>
              <span className="text-lg font-bold text-gray-900" dir="ltr">۰۲۱-۸۸۸۸۹۹۹۹</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">پست الکترونیک</span>
              <span className="text-sm font-semibold text-gray-900">{BRAND.supportEmail}</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">ساعات پاسخگویی</span>
              <span className="text-sm font-semibold text-gray-900">همه‌روزه از ۸:۰۰ تا ۲۳:۰۰</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">مرکز توزیع و انبار مرکزی</span>
              <span className="text-sm font-semibold text-gray-900">تهران، خیابان سهروردی شمالی</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
