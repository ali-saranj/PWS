import React from 'react';
import Link from 'next/link';
import { Sparkles, ShoppingBag, ArrowLeft, Percent, ShieldCheck, ThermometerSnowflake, Truck, CheckCircle2 } from 'lucide-react';

export interface HeroBannerProps {
  headline?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  discountPillText?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  headline = 'پروتئین ایرانی / مرجع تخصصی سوسیس، کالباس و مزه‌های اصیل در اصفهان',
  subtitle = 'عرضه مستقیم تازه‌ترین سوسیس و ژامبون ممتاز، انواع پنیر پیتزا و گودا، سس‌های خاص، ترشیجات و خیارشور ترد با ارسال سریع در اصفهان',
  ctaText = 'خرید محصولات',
  ctaHref = '/products',
  discountPillText = 'تخفیف‌های ویژه تا ۵۰٪',
}) => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-primary-dark to-emerald-800 text-white shadow-xl shadow-primary/10">
      {/* Background visual flourishes */}
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-1/3 -top-24 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/4 top-1/2 w-48 h-48 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 px-6 py-10 sm:px-12 sm:py-14 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Main Content Column */}
        <div className="max-w-2xl space-y-6">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>فروشگاه تخصصی پروتئین ایرانی در اصفهان</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/90 text-white text-xs font-bold shadow-sm animate-pulse">
              <Percent className="w-3.5 h-3.5" />
              <span>{discountPillText}</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-white drop-shadow-sm">
            {headline}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-emerald-100 leading-relaxed font-medium">
            {subtitle}
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href={ctaHref}
              className="px-6 py-3 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/20 transition-all flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span>{ctaText}</span>
            </Link>

            <Link
              href="/discounts"
              className="px-5 py-3 bg-emerald-700/60 hover:bg-emerald-700 text-white border border-emerald-400/30 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center gap-2"
            >
              <span>پیشنهادهای شگفت‌انگیز</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Decorative Deli Feature Card on Left (Desktop) */}
        <div className="hidden lg:flex flex-col gap-3.5 w-80 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-white shadow-2xl flex-shrink-0">
          <div className="flex items-center gap-3 pb-3 border-b border-white/15">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <ThermometerSnowflake className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-100 block">استاندارد برتر دلی</span>
              <span className="text-sm font-black">زنجیره سرمایش اختصاصی</span>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs text-emerald-50">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span>ارسال در بسته‌بندی عایق با ژل یخ</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span>تأمین روزانه از برندهای برتر آندره، ۲۰۲ و کاله</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span>تحویل سریع و تازه در سراسر شهر اصفهان</span>
            </li>
          </ul>

          <div className="pt-2 text-[11px] text-emerald-200 border-t border-white/10 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-emerald-300" />
            <span>ارسال سریع و مطمئن درب منزل</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
