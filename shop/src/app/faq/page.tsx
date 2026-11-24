import React from 'react';
import type { Metadata } from 'next';
import { BRAND } from '@/config/branding';
import { TrustPageContainer } from '@/components/TrustPageContainer';
import { HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'پرسش‌های متداول',
  description: `پاسخ به سوالات متداول درباره نحوه ارسال، زمان تحویل، ثبت سفارش و پرداخت در ${BRAND.nameFa}.`,
  alternates: {
    canonical: `${BRAND.domain}/faq`,
  },
};

const FAQ_ITEMS = [
  {
    q: 'سفارشات چگونه و با چه کیفیتی در اصفهان ارسال می‌شوند؟',
    a: 'کلیه سفارشات شهر اصفهان با ناوگان اختصاصی مجهز به جعبه‌های عایق و پدهای یخ خشک ارسال می‌شوند تا دمای زنجیره سرما برای سوسیس، ژامبون و پنیر کاملاً حفظ گردد.',
  },
  {
    q: 'زمان تحویل سفارش‌ها چقدر است؟',
    a: 'سفارشات ثبت‌شده در ساعات کاری فروشگاه، به صورت ارسال فوری در بازه زمانی ۶۰ الی ۱۲۰ دقیقه در سراسر مناطق شهر اصفهان تحویل داده می‌شوند.',
  },
  {
    q: 'آیا برای خرید نیاز به ثبت نام و کلمه عبور است؟',
    a: 'خیر! ورود و ثبت نام در پروتئین ایرانی صرفاً با شماره همراه و دریافت کد پیامکی یک‌بارمصرف (OTP) در چند ثانیه انجام می‌شود.',
  },
  {
    q: 'حداقل مبلغ سفارش برای ارسال چقدر است؟',
    a: 'محدودیتی برای ثبت سفارش وجود ندارد و سفارش‌ها بر اساس تعرفه مصوب پیک موتوری ارسال می‌گردند.',
  },
  {
    q: 'آیا امکان خرید عمده برای فست‌فودها و ساندویچی‌ها وجود دارد؟',
    a: 'بله؛ تمام اقلام پرمصرف مانند خیارشور دبه‌ای، پنیر پیتزا و سوسیس دارای سیستم تخفیف پلکانی هستند و فاکتور رسمی عمده صادر می‌گردد.',
  },
];

export default function FaqPage() {
  return (
    <TrustPageContainer
      title="پرسش‌های متداول مشتریان"
      subtitle={`پاسخ به پرسش‌های رایج در خصوص نحوه ثبت سفارش، ارسال و کیفیت محصولات در ${BRAND.nameFa}`}
      badge="راهنمای سریع کاربران"
    >
      <div className="space-y-4">
        {FAQ_ITEMS.map((item, idx) => (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-primary/30 transition-colors"
          >
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-start gap-2.5 mb-2">
              <HelpCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>{item.q}</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pr-6">{item.a}</p>
          </div>
        ))}
      </div>
    </TrustPageContainer>
  );
}
