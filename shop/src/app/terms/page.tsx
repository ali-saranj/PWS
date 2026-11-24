import React from 'react';
import type { Metadata } from 'next';
import { BRAND } from '@/config/branding';
import { TrustPageContainer } from '@/components/TrustPageContainer';

export const metadata: Metadata = {
  title: 'قوانین و مقررات خرید',
  description: `شرایط و قوانین استفاده از خدمات، ثبت سفارش اینترنتی و تحویل کالا در فروشگاه تخصصی ${BRAND.nameFa}.`,
  alternates: {
    canonical: `${BRAND.domain}/terms`,
  },
};

export default function TermsPage() {
  return (
    <TrustPageContainer
      title="قوانین و مقررات خرید اینترنتی"
      subtitle={`شرایط و ضوابط رسمی استفاده از خدمات و خرید آنلاین از فروشگاه تخصصی ${BRAND.nameFa}`}
      badge="مقررات و شفافیت خرید"
    >
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 border-r-4 border-primary pr-3">
          ۱. ماده اول: تعاریف و کلیات
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          ورود کاربران به وب‌سایت {BRAND.nameFa} و ثبت سفارش به منزله آگاهی کامل و پذیرش کلیه شرایط و مقررات مندرج در این صفحه است. کلیه فعالیت‌های این فروشگاه منطبق با قوانین جمهوری اسلامی ایران، قانون تجارت الکترونیک و قانون حمایت از حقوق مصرف‌کننده می‌باشد.
        </p>
      </section>

      <section className="space-y-4 pt-4 border-t border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 border-r-4 border-primary pr-3">
          ۲. ثبت، پردازش و ارسال سفارش
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          سفارش‌ها همه‌روزه پردازش شده و در ساعات کاری اعلام‌شده از طریق ناوگان حمل مجهز به جعبه‌های عایق برودتی ارسال می‌گردند. کاربر موظف است مشخصات دقیق، شماره تماس معتبر و آدرس کامل تحویل‌گیرنده را ثبت نماید.
        </p>
      </section>

      <section className="space-y-4 pt-4 border-t border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 border-r-4 border-primary pr-3">
          ۳. ضمانت اصالت و تاریخ مصرف کالا
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          {BRAND.nameFa} اصالت و سلامت کلیه فرآورده‌های پروتئینی، سوسیس، ژامبون، پنیرهای پیتزا و ترشیجات را تضمین می‌کند. تمامی اقلام دارای تاریخ تولید روز و برچسب‌های استاندارد بهداشتی سازمان غذا و دارو می‌باشند.
        </p>
      </section>

      <section className="space-y-4 pt-4 border-t border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 border-r-4 border-primary pr-3">
          ۴. لغو سفارش و انصراف از خرید
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          با توجه به فسادپذیری فرآورده‌های غذایی و پروتئینی، لغو سفارش تنها تا پیش از خروج مرسوله از محل فروشگاه و تحویل به پیک امکان‌پذیر است. پس از ارسال سفارش، در صورت وجود مغایرت یا آسیب فیزیکی، مطابق با «رویه‌های بازگرداندن کالا» اقدام خواهد شد.
        </p>
      </section>
    </TrustPageContainer>
  );
}
