import React from 'react';
import type { Metadata } from 'next';
import { BRAND } from '@/config/branding';
import { TrustPageContainer } from '@/components/TrustPageContainer';
import { ShoppingBag, KeyRound, MapPin, CreditCard, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'نحوه ثبت سفارش آنلاین',
  description: `راهنمای گام‌به‌گام و تصویری خرید آنلاین انواع فرآورده‌های پروتئینی در فروشگاه ${BRAND.nameFa}.`,
  alternates: {
    canonical: `${BRAND.domain}/how-to-order`,
  },
};

const STEPS = [
  {
    icon: ShoppingBag,
    title: '۱. انتخاب محصولات و وزن درخواستی',
    desc: 'کالاهای مورد نظر خود را از کاتالوگ یا صفحه دسته‌بندی‌ها انتخاب نمایید. در صورت نیاز وزن دلخواه یا بسته‌بندی را مشخص کرده و به سبد خرید اضافه کنید.',
  },
  {
    icon: KeyRound,
    title: '۲. ورود سریع با شماره موبایل',
    desc: 'نیازی به ثبت رمز عبور پیچیده نیست؛ شماره موبایل خود را وارد کرده و با کد تایید ۶ رقمی پیامک‌شده فوراً وارد حساب کاربری خود شوید.',
  },
  {
    icon: MapPin,
    title: '۳. ثبت نشانی دقیق تحویل',
    desc: 'آدرس، پلاک، واحد و نام تحویل‌گیرنده در شهر اصفهان را ثبت کنید تا پیک اختصاصی سفارش را مستقیماً تحویل دهد.',
  },
  {
    icon: CreditCard,
    title: '۴. پرداخت امن اینترنتی',
    desc: 'فاکتور سفارش را از طریق درگاه پرداخت متصل به کلیه کارت‌های عضو شتاب تسویه نمایید.',
  },
  {
    icon: CheckCircle2,
    title: '۵. دریافت پیامک و تحویل سریع',
    desc: 'کد رهگیری پیامک شده و مرسوله با بسته‌بندی عایق زنجیره سرما در سریع‌ترین زمان درب منزل به شما تحویل می‌گردد.',
  },
];

export default function HowToOrderPage() {
  return (
    <TrustPageContainer
      title="راهنمای ثبت سفارش آنلاین"
      subtitle={`مراحل ساده، سریع و مطمئن خرید اینترنتی در سوپرمارکت تخصصی پروتئین ${BRAND.nameFa}`}
      badge="راهنمای گام‌به‌گام خرید"
    >
      <div className="space-y-6">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-gray-50/70 border border-gray-100"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-1">{step.title}</h2>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </TrustPageContainer>
  );
}
