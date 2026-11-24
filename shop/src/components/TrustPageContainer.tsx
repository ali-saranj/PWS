import React from 'react';
import Link from 'next/link';
import { BRAND } from '@/config/branding';
import { Phone, MapPin, Clock, Mail, ShieldCheck } from 'lucide-react';

export interface TrustPageContainerProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
}

export function TrustPageContainer({
  title,
  subtitle,
  badge = 'خدمات و قوانین رسمی',
  children,
}: TrustPageContainerProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-vazirmatn" dir="rtl">
      {/* Breadcrumb Navigation */}
      <nav aria-label="مسیر راهنما" className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          صفحه اصلی
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{title}</span>
      </nav>

      {/* Header Banner */}
      <div className="mb-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{badge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black mb-2 text-white">{title}</h1>
        {subtitle && <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{subtitle}</p>}
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm leading-relaxed text-gray-700 space-y-6">
        {children}

        {/* Official Store Contact Footer Callout */}
        <div className="mt-10 pt-8 border-t border-gray-100 bg-gray-50/70 -mx-6 -mb-6 sm:-mx-10 sm:-mb-10 p-6 sm:p-8 rounded-b-3xl">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>ارتباط با واحد پشتیبانی و امور مشتریان {BRAND.nameFa}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary flex-shrink-0" />
              <span>تلفن تماس:</span>
              <span className="font-semibold text-gray-900 dir-ltr">{BRAND.phoneFa}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary flex-shrink-0" />
              <span>پست الکترونیک:</span>
              <span className="font-semibold text-gray-900">{BRAND.supportEmail}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>نشانی:</span>
              <span className="font-semibold text-gray-900">{BRAND.addressFa}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <span>ساعات کاری:</span>
              <span className="font-semibold text-gray-900">{BRAND.workingHoursFa}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrustPageContainer;
