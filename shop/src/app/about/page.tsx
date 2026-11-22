import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Truck, Clock, Sparkles } from 'lucide-react';
import { BRAND } from '@/config/branding';

export const metadata: Metadata = {
  title: `درباره ${BRAND.nameFa} اصفهان | فروشگاه تخصصی فرآورده‌های پروتئینی`,
  description: `آشنایی با فروشگاه ${BRAND.nameFa} واقع در اصفهان (رهنان)، عرضه تخصصی انواع سوسیس، کالباس، پنیر پیتزا، سس‌ها، ترشیجات و خیارشور.`,
  alternates: {
    canonical: `${BRAND.domain}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-vazirmatn">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          صفحه اصلی
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">درباره {BRAND.nameFa}</span>
      </nav>

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-sm">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
          درباره {BRAND.titleFa}
        </h1>

        <p className="text-gray-700 leading-relaxed mb-6 text-base sm:text-lg">
          <strong>{BRAND.nameFa}</strong> واقع در اصفهان (خیابان رهنان، خیابان مطهری، چهارراه طاحونه)، با هدف عرضه مستقیم و روزانه تازه‌ترین فرآورده‌های پروتئینی پایه‌گذاری شده است. تخصص اصلی ما ارائه انواع سوسیس و هات‌داگ درجه یک، کالباس و ژامبون ممتاز، پنیرهای تخصصی (پیتزا، گودا، ورقه‌ای)، انواع سس‌های خاص و چاشنی‌ها، و خیارشور و ترشیجات اصیل می‌باشد.
        </p>

        <p className="text-gray-600 leading-relaxed mb-8">
          ما به کیفیت و سلامت محصولات پروتئینی اهمیت ویژه‌ای می‌دهیم. تمامی سفارش‌ها در کوتاه‌ترین زمان، با بسته‌بندی استاندارد بهداشتی و عایق حفظ زنجیره سرما، در سراسر شهر اصفهان تحویل مشتریان گرامی می‌گردد. همچنین امکان خرید حضوری در فروشگاه دهکده پروتئین در رهنان اصفهان همه‌روزه از ساعت ۹:۰۰ صبح تا ۲۳:۰۰ شب فراهم است.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">ضمانت اصالت و سلامت</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                تنها با معتبرترین کارخانجات و برندهای دارای سیب سلامت همکاری می‌کنیم.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">ارسال سریع و بهداشتی</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                ارسال فوری با بسته‌بندی عایق جهت حفظ دمای ایده‌آل فرآورده‌های پروتئینی.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
