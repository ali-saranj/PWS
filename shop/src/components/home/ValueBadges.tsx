import React from 'react';
import { Truck, ShieldCheck, Clock, Headphones, Snowflake } from 'lucide-react';

export interface ValueBadgesProps {
  deliveryText?: string;
}

export const ValueBadges: React.FC<ValueBadgesProps> = ({
  deliveryText = 'تحویل سریع درب منزل با بسته‌بندی ایمن و استاندارد',
}) => {
  const badges = [
    {
      icon: Truck,
      title: 'تحویل سریع و اکسپرس',
      description: 'ارسال فوری با ناوگان اختصاصی در زمان دلخواه مشتریان',
      color: 'text-primary bg-primary/10 border-primary/20',
    },
    {
      icon: ShieldCheck,
      title: 'ضمانت کیفیت و اصالت',
      description: 'تضمین تازگی و اصالت صددرصدی کلیه محصولات پروتئینی و غذایی',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
    },
    {
      icon: Snowflake,
      title: 'بسته‌بندی زنجیره سرد',
      description: 'ارسال با یخدان و عایق حرارتی جهت حفظ حداکثر طراوت کالا',
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200/60',
    },
    {
      icon: Headphones,
      title: 'پشتیبانی و پیگیری ۲۴ ساعته',
      description: 'پاسخگویی سریع به سفارش‌ها و مشاوره تخصصی در ۷ روز هفته',
      color: 'text-amber-600 bg-amber-50 border-amber-200/60',
    },
  ];

  return (
    <section className="py-4" aria-label="مزایای خرید از پروتئین ایرانی">
      {/* Top Highlight Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-primary-dark to-emerald-800 text-white rounded-2xl p-4 sm:p-5 shadow-sm mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-amber-300 shadow-inner">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">
              {deliveryText}
            </h3>
            <p className="text-xs text-emerald-100">
              ارسال فوری و تازه در سراسر شهر اصفهان با بسته‌بندی عایق و یخدان مخصوص
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20">
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span>تضمین ارسال به‌موقع</span>
        </div>
      </div>

      {/* Grid of 4 Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {badges.map((badge, idx) => {
          const IconComponent = badge.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-3"
            >
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${badge.color}`}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-bold text-gray-800">
                  {badge.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                  {badge.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ValueBadges;
