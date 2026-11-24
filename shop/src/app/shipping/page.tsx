import React from 'react';
import type { Metadata } from 'next';
import { BRAND } from '@/config/branding';
import { TrustPageContainer } from '@/components/TrustPageContainer';
import { Truck, ThermometerSnowflake, Clock, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'بسته‌بندی و شیوه‌های ارسال',
  description: `نحوه بسته‌بندی عایق زنجیره سرما، زمان ارسال و مناطق تحت پوشش در اصفهان برای خرید از ${BRAND.nameFa}.`,
  alternates: {
    canonical: `${BRAND.domain}/shipping`,
  },
};

export default function ShippingPage() {
  return (
    <TrustPageContainer
      title="بسته‌بندی و شیوه‌های ارسال"
      subtitle={`تضمین سلامت و زنجیره سرمای فرآورده‌های پروتئینی تا لحظه تحویل در شهر اصفهان`}
      badge="زنجیره سرمای مطمئن"
    >
      <div className="space-y-6">
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
            <ThermometerSnowflake className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">بسته‌بندی اختصاصی عایق دما</h2>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              سوسیس، ژامبون، پنیرهای پیتزا و لبنیات فرآوری‌شده به تغییرات دمایی حساس هستند. کلیه مرسولات در پاکت‌ها و محفظه‌های عایق حرارتی همراه با پدهای برودتی بسته‌بندی می‌شوند تا طراوت، بهداشت و کیفیت بافت کالا حفظ گردد.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-gray-50/80 border border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-primary font-bold text-sm">
              <Clock className="w-5 h-5" />
              <span>زمان‌بندی و بازه تحویل</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              ارسال سفارشات همه‌روزه از ساعت ۹:۰۰ الی ۲۳:۰۰ در شهر اصفهان انجام می‌شود. میانگین زمان تحویل سفارشات عادی بین ۶۰ تا ۱۲۰ دقیقه پس از ثبت و تایید فاکتور می‌باشد.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50/80 border border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-primary font-bold text-sm">
              <MapPin className="w-5 h-5" />
              <span>مناطق تحت پوشش</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              کلیه مناطق ۱۵ گانه شهرداری اصفهان، منطقه رهنان، خیابان مطهری، چهارراه طاحونه و حومه تحت پوشش کامل ناوگان پیک اختصاصی {BRAND.nameFa} قرار دارند.
            </p>
          </div>
        </div>
      </div>
    </TrustPageContainer>
  );
}
