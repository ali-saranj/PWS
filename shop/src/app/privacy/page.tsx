import React from 'react';
import type { Metadata } from 'next';
import { BRAND } from '@/config/branding';
import { TrustPageContainer } from '@/components/TrustPageContainer';

export const metadata: Metadata = {
  title: 'حریم خصوصی کاربران',
  description: `سیاست‌های حفاظت از حریم شخصی، امنیت شماره موبایل و اطلاعات کاربران در ${BRAND.nameFa}.`,
  alternates: {
    canonical: `${BRAND.domain}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <TrustPageContainer
      title="سیاست حریم خصوصی کاربران"
      subtitle={`تعهدنامه امنیت و حفاظت از داده‌ها و حریم شخصی مشتریان گرامی در ${BRAND.nameFa}`}
      badge="حفاظت و امنیت اطلاعات"
    >
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 border-r-4 border-primary pr-3">
          ۱. اطلاعات جمع‌آوری‌شده و هدف از استفاده
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          برای ثبت سفارش، احراز هویت با پیامک یک‌بارمصرف (OTP) و ارسال سریع مرسولات، اطلاعاتی نظیر شماره تلفن همراه، نام تحویل‌گیرنده و نشانی پستی اخذ می‌گردد. این اطلاعات منحصراً برای پردازش سفارش، اطلاع‌رسانی پیامکی و هماهنگی پیک استفاده می‌شوند.
        </p>
      </section>

      <section className="space-y-4 pt-4 border-t border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 border-r-4 border-primary pr-3">
          ۲. امنیت و محرمانگی داده‌ها
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          {BRAND.nameFa} متعهد می‌شود که اطلاعات هویتی و شماره‌های تماس کاربران را به هیچ عنوان در اختیار اشخاص ثالث، شرکت‌های تبلیغاتی یا بازاریابی قرار ندهد. تمامی ارتباطات داده‌ای با سرورهای فروشگاه از طریق پروتکل رمزنگاری‌شده HTTPS و زیرساخت امن صورت می‌پذیرد.
        </p>
      </section>

      <section className="space-y-4 pt-4 border-t border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 border-r-4 border-primary pr-3">
          ۳. اطلاعات پرداخت و کارت‌های بانکی
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          هیچ‌گونه اطلاعات مربوط به شماره کارت، رمز دوم یا اطلاعات حساب بانکی در سیستم‌های {BRAND.nameFa} ذخیره نمی‌گردد. تمامی تراکنش‌ها از طریق درگاه‌های پرداخت رسمی شبکه شاپرک و در بسترهای معتبر بانکی دارای نماد اعتماد الکترونیک پردازش می‌شوند.
        </p>
      </section>
    </TrustPageContainer>
  );
}
