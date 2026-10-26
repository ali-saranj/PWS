import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Flame, ShieldCheck, Tag } from 'lucide-react';

export interface PromoTileData {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  ctaText: string;
  href: string;
  bgGradient: string;
  badgeBg: string;
  textColor: string;
  icon: 'flame' | 'shield' | 'tag';
}

export const DEFAULT_PROMO_TILES: PromoTileData[] = [
  {
    id: 'tile-sausage',
    title: 'فروش ویژه سوسیس و ژامبون',
    subtitle: 'انواع فرآورده‌های گوشتی تازه از بهترین برندها با کیفیت ممتاز',
    badge: 'تا ۴۰٪ تخفیف',
    ctaText: 'مشاهده و خرید',
    href: '/category/sausage-hotdog',
    bgGradient: 'from-rose-600 via-rose-700 to-rose-900',
    badgeBg: 'bg-white/20 text-white border-white/30',
    textColor: 'text-rose-100',
    icon: 'flame',
  },
  {
    id: 'tile-dairy',
    title: 'لبنیات تازه با تضمین کیفیت',
    subtitle: 'شیر، پنیر، کره و ماست ارگانیک با ارسال فوری و ماندگاری بالا',
    ctaText: 'مشاهده محصولات',
    href: '/category/dairy-cheese',
    bgGradient: 'from-emerald-600 via-emerald-700 to-teal-800',
    badgeBg: 'bg-emerald-500/30 text-emerald-100 border-emerald-400/30',
    textColor: 'text-emerald-100',
    icon: 'shield',
  },
  {
    id: 'tile-snacks',
    title: 'تنقلات و چیپس',
    subtitle: 'طعم‌های هیجان‌انگیز چیپس، پفک، ذرت بوداده و مغزیجات ترد',
    badge: 'تا ۳۰٪ تخفیف',
    ctaText: 'خرید تنقلات',
    href: '/category/snacks-chips',
    bgGradient: 'from-amber-500 via-amber-600 to-amber-700',
    badgeBg: 'bg-white/20 text-white border-white/30',
    textColor: 'text-amber-100',
    icon: 'tag',
  },
];

export interface PromoTilesProps {
  tiles?: PromoTileData[];
}

export const PromoTiles: React.FC<PromoTilesProps> = ({
  tiles = DEFAULT_PROMO_TILES,
}) => {
  return (
    <section className="py-4" aria-label="پیشنهادهای ویژه و بنرهای تبلیغاتی">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiles.map((tile) => {
          return (
            <div
              key={tile.id}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tile.bgGradient} p-6 text-white shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between min-h-[190px]`}
            >
              {/* Decorative shapes */}
              <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="absolute right-0 -top-8 w-24 h-24 bg-black/10 rounded-full blur-lg pointer-events-none" />

              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  {tile.badge ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border backdrop-blur-sm ${tile.badgeBg}`}
                    >
                      <Sparkles className="w-3 h-3" />
                      {tile.badge}
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${tile.badgeBg}`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      تضمین سلامت
                    </span>
                  )}
                  {tile.icon === 'flame' && <Flame className="w-5 h-5 text-amber-300 animate-bounce" />}
                  {tile.icon === 'shield' && <ShieldCheck className="w-5 h-5 text-emerald-200" />}
                  {tile.icon === 'tag' && <Tag className="w-5 h-5 text-amber-200" />}
                </div>

                <h3 className="text-lg sm:text-xl font-bold leading-snug drop-shadow-sm pt-1">
                  {tile.title}
                </h3>
                <p className={`text-xs ${tile.textColor} line-clamp-2 leading-relaxed`}>
                  {tile.subtitle}
                </p>
              </div>

              <div className="relative z-10 pt-4">
                <Link
                  href={tile.href}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 active:scale-95 text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all"
                >
                  <span>{tile.ctaText}</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PromoTiles;
