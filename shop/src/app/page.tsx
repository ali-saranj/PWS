import Link from 'next/link';
import { ArrowLeft, Sparkles, ShoppingBag } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-gradient-to-br from-emerald-600 via-primary-dark to-emerald-800 rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-primary/10 relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>سوپرمارکت تخصصی مواد غذایی و پروتئینی سبد سبز</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight">
            تأمین روزانه مواد غذایی و پروتئینی با بهترین کیفیت و قیمت
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
            انواع سوسیس و کالباس درجه یک، فرآورده‌های تازه، چاشنی‌ها و نان ساندویچی
            با ارسال فوری و بسته‌بندی عایق حرارتی در تهران و سراسر ایران.
          </p>
          <div className="pt-4 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="px-6 py-3 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span>مشاهده و خرید محصولات</span>
            </Link>
            <Link
              href="/discounts"
              className="px-6 py-3 bg-emerald-700/60 hover:bg-emerald-700 text-white border border-emerald-400/30 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
            >
              <span>تخفیف‌های شگفت‌انگیز</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/2 -top-20 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
}
