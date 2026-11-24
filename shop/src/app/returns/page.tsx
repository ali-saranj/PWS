import React from 'react';
import type { Metadata } from 'next';
import { BRAND } from '@/config/branding';
import { TrustPageContainer } from '@/components/TrustPageContainer';

export const metadata: Metadata = {
  title: 'رویه‌های بازگرداندن کالا',
  description: `شرایط مرجوعی، ضمانت سلامت و نحوه پیگیری شکایات فرآورده‌های پروتئینی در ${BRAND.nameFa}.`,
  alternates: {
    canonical: `${BRAND.domain}/returns`,
  },
};

export default function ReturnsPage() {
  return (
    <TrustPageContainer
      title="رویه‌های بازگرداندن و ضمانت کیفیت کالا"
      subtitle={`راهنمای شفاف بازگشت وجه، تعویض کالا و پیگیری سفارشات در ${BRAND.nameFa}`}
      badge="ضمانت سلامت و تازگی"
    >
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 border-r-4 border-primary pr-3">
          ۱. شرایط ویژه کالاهای پروتئینی و فاسدشدنی
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          به دلیل ماهیت فسادپذیر سوسیس، کالباس، پنیر و مواد یخچالی، خریدار موظف است در زمان تحویل گرفتن سفارش از سفیر ارسال، سلامت ظاهری بسته‌بندی، پلمب و تاریخ انقضای اقلام را بررسی نماید. در صورت مشاهده هرگونه نقص، خریدار می‌تواند از تحویل گرفتن کالا خودداری کند.
        </p>
      </section>

      <section className="space-y-4 pt-4 border-t border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 border-r-4 border-primary pr-3">
          ۲. موارد پذیرش مرجوعی کالا
        </h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
          <li>مغایرت کالای تحویل‌شده با مشخصات یا برند ثبت‌شده در فاکتور خرید آنلاین.</li>
          <li>نقص در بسته‌بندی وکیوم یا نشت مایعات در زمان تحویل توسط پیک.</li>
          <li>تاریخ مصرف منقضی یا ناکافی بودن زمان ماندگاری استاندارد محصول.</li>
        </ul>
      </section>

      <section className="space-y-4 pt-4 border-t border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 border-r-4 border-primary pr-3">
          ۳. مراحل بازگشت وجه یا ارسال مجدد
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          در صورت احراز شرایط مرجوعی، وجه فاکتور حداکثر ظرف مدت ۲۴ ساعت کاری به شماره شبای ثبت‌شده در حساب کاربری مسترد می‌گردد؛ یا بنا به تمایل مشتری، سفارش بی‌نقص مجدداً با ارسال فوری و بدون هزینه ارسال اعزام خواهد شد.
        </p>
      </section>
    </TrustPageContainer>
  );
}
