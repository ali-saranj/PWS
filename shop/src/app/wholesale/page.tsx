import React from 'react';
import type { Metadata } from 'next';
import { BRAND } from '@/config/branding';
import { TrustPageContainer } from '@/components/TrustPageContainer';
import { Layers, Percent, Truck, PhoneCall, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'خرید عمده سوسیس و کالباس و مواد اولیه ساندویچی و فست‌فود',
  description: `خرید عمده سوسیس و کالباس و تامین مواد اولیه ساندویچی و فست‌فود (خیارشور دبه‌ای، پنیر پیتزا فله، سس گالنی) با تخفیف پلکانی و ارسال فوری در اصفهان از ${BRAND.nameFa}.`,
  alternates: {
    canonical: `${BRAND.domain}/wholesale`,
  },
};

export default function WholesalePage() {
  return (
    <TrustPageContainer
      title="تامین عمده فست‌فودها، پیتزافروشی‌ها و اغذیه‌فروشی‌ها"
      subtitle={`عرضه مستقیم خیارشور دبه‌ای و حلب، پنیر پیتزا فله، سوسیس و کالباس درجه یک با تخفیف پلکانی در اصفهان`}
      badge="تامین دست‌اول و قیمت پلکانی"
    >
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-700 via-primary-dark to-emerald-900 text-white shadow-md">
          <div className="flex items-center gap-2 mb-2 text-amber-300 font-bold text-sm">
            <Percent className="w-5 h-5" />
            <span>سیستم تخفیف پلکانی خودکار (Volume Tier Pricing)</span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
            در {BRAND.nameFa} برای هر محصول، قیمت‌های تیراژ به صورت خودکار محاسبه می‌گردد. با افزایش تعداد خرید اقلامی نظیر خیارشور ۱۳ کیلویی، پنیر پیتزا فله یا ژامبون، قیمت هر واحد به طور تصاعدی کاهش می‌یابد.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>خیارشور دبه‌ای و قوطی</span>
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              تامین دائمی خیارشور ممتاز، نول، ویژه نمکی در دبه‌های ۱۳ کیلویی و پت‌های ۶ کیلویی برندهای رهنمود، باسنی و کارگاهی.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>پنیر پیتزا و گودا ساندویچ</span>
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              پنیر پیتزا دو رنگ و تک‌رنگ کش‌دار فله، پنیر ورقه‌ای چدار، دیپ و سس‌های گالنی مخصوص فست‌فودها.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>سوسیس و کالباس فله و کارتنی</span>
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              هات‌داگ، کوکتل، فرانکفورتر و ژامبون‌های درصد بالا با بسته‌بندی‌های کارتنی و تخفیف همکاری.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>ارسال برنامه‌ریزی‌شده</span>
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              امکان ارسال روزانه یا هفتگی طبق برنامه مدون برای آشپزخانه‌ها، فودکورت‌ها و ساندویچی‌های اصفهان.
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">مشاوره و هماهنگی خرید عمده</div>
              <div className="text-sm sm:text-base font-bold text-gray-900 dir-ltr">{BRAND.phoneFa}</div>
            </div>
          </div>

          <Link
            href="/products"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-bold text-center transition-colors"
          >
            مشاهده کاتالوگ و تخفیف‌های پلکانی
          </Link>
        </div>
      </div>
    </TrustPageContainer>
  );
}
