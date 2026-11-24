import React from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Beef,
  Apple,
  Salad,
  Sandwich,
  Cookie,
  Package,
  Milk,
  Flame,
  Drumstick,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryItem {
  id?: number | string;
  nameFa: string;
  slug: string;
  iconName?: string;
  color?: string;
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 1,
    nameFa: 'سوسیس و هات‌داگ',
    slug: 'sausage-hotdog',
    color: 'bg-rose-50 text-rose-600 border-rose-200/60 group-hover:bg-rose-500 group-hover:text-white',
  },
  {
    id: 2,
    nameFa: 'کالباس و ژامبون',
    slug: 'ham-coldcuts',
    color: 'bg-amber-50 text-amber-600 border-amber-200/60 group-hover:bg-amber-500 group-hover:text-white',
  },
  {
    id: 3,
    nameFa: 'خیارشور و ترشیجات',
    slug: 'pickles',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200/60 group-hover:bg-emerald-500 group-hover:text-white',
  },
  {
    id: 4,
    nameFa: 'سس و چاشنی',
    slug: 'sauces-condiments',
    color: 'bg-red-50 text-red-600 border-red-200/60 group-hover:bg-red-500 group-hover:text-white',
  },
  {
    id: 5,
    nameFa: 'نان ساندویچی',
    slug: 'bread',
    color: 'bg-yellow-50 text-yellow-600 border-yellow-200/60 group-hover:bg-yellow-500 group-hover:text-white',
  },
  {
    id: 6,
    nameFa: 'چیپس و تنقلات',
    slug: 'snacks-chips',
    color: 'bg-orange-50 text-orange-600 border-orange-200/60 group-hover:bg-orange-500 group-hover:text-white',
  },
  {
    id: 7,
    nameFa: 'کنسروجات',
    slug: 'canned-food',
    color: 'bg-blue-50 text-blue-600 border-blue-200/60 group-hover:bg-blue-500 group-hover:text-white',
  },
  {
    id: 8,
    nameFa: 'لبنیات و پنیر',
    slug: 'dairy-cheese',
    color: 'bg-cyan-50 text-cyan-600 border-cyan-200/60 group-hover:bg-cyan-500 group-hover:text-white',
  },
];

const categoryIconMap: Record<string, LucideIcon> = {
  'sausages-hotdogs': Flame,
  'sausage-hotdog': Flame,
  'turkey-ham': Drumstick,
  'cold-cuts-deli': UtensilsCrossed,
  'ham-coldcuts': UtensilsCrossed,
  'beef-ham': Beef,
  'pickles-condiments': Apple,
  'pickles': Apple,
  'sauces': Salad,
  'sauces-condiments': Salad,
  'sandwich-bread': Sandwich,
  'bread': Sandwich,
  'chips-snacks': Cookie,
  'snacks-chips': Cookie,
  'canned-goods': Package,
  'canned-food': Package,
  'dairy-cheese': Milk,
};

const categoryColorMap: Record<string, string> = {
  'sausages-hotdogs': 'bg-rose-50 text-rose-600 border-rose-200/60 group-hover:bg-rose-500 group-hover:text-white',
  'sausage-hotdog': 'bg-rose-50 text-rose-600 border-rose-200/60 group-hover:bg-rose-500 group-hover:text-white',
  'turkey-ham': 'bg-amber-50 text-amber-600 border-amber-200/60 group-hover:bg-amber-500 group-hover:text-white',
  'cold-cuts-deli': 'bg-red-50 text-red-600 border-red-200/60 group-hover:bg-red-500 group-hover:text-white',
  'ham-coldcuts': 'bg-red-50 text-red-600 border-red-200/60 group-hover:bg-red-500 group-hover:text-white',
  'beef-ham': 'bg-purple-50 text-purple-600 border-purple-200/60 group-hover:bg-purple-500 group-hover:text-white',
  'pickles-condiments': 'bg-emerald-50 text-emerald-600 border-emerald-200/60 group-hover:bg-emerald-500 group-hover:text-white',
  'pickles': 'bg-emerald-50 text-emerald-600 border-emerald-200/60 group-hover:bg-emerald-500 group-hover:text-white',
  'sauces': 'bg-orange-50 text-orange-600 border-orange-200/60 group-hover:bg-orange-500 group-hover:text-white',
  'sauces-condiments': 'bg-orange-50 text-orange-600 border-orange-200/60 group-hover:bg-orange-500 group-hover:text-white',
  'sandwich-bread': 'bg-yellow-50 text-yellow-600 border-yellow-200/60 group-hover:bg-yellow-500 group-hover:text-white',
  'bread': 'bg-yellow-50 text-yellow-600 border-yellow-200/60 group-hover:bg-yellow-500 group-hover:text-white',
  'chips-snacks': 'bg-pink-50 text-pink-600 border-pink-200/60 group-hover:bg-pink-500 group-hover:text-white',
  'snacks-chips': 'bg-pink-50 text-pink-600 border-pink-200/60 group-hover:bg-pink-500 group-hover:text-white',
  'canned-goods': 'bg-blue-50 text-blue-600 border-blue-200/60 group-hover:bg-blue-500 group-hover:text-white',
  'canned-food': 'bg-blue-50 text-blue-600 border-blue-200/60 group-hover:bg-blue-500 group-hover:text-white',
  'dairy-cheese': 'bg-cyan-50 text-cyan-600 border-cyan-200/60 group-hover:bg-cyan-500 group-hover:text-white',
};

export interface CategoryCirclesProps {
  categories?: CategoryItem[];
}

export const CategoryCircles: React.FC<CategoryCirclesProps> = ({
  categories = DEFAULT_CATEGORIES,
}) => {
  const items = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const gridClass =
    items.length >= 9
      ? 'grid-cols-3 sm:grid-cols-5 lg:grid-cols-9'
      : 'grid-cols-4 sm:grid-cols-4 md:grid-cols-8';

  return (
    <section className="py-4" aria-label="دسته‌بندی‌های اصلی">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span>دسته‌بندی‌های محبوب</span>
        </h2>
        <Link
          href="/products"
          className="text-xs sm:text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
        >
          مشاهده تمام دسته‌ها
        </Link>
      </div>

      <div className={`grid ${gridClass} gap-3 sm:gap-4`}>
        {items.map((cat, idx) => {
          const IconComponent = categoryIconMap[cat.slug] || UtensilsCrossed;
          const colorClass =
            cat.color ||
            categoryColorMap[cat.slug] ||
            DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length].color ||
            'bg-emerald-50 text-emerald-600 border-emerald-200/60 group-hover:bg-emerald-500 group-hover:text-white';

          const targetHref = cat.slug
            ? `/products?categorySlug=${encodeURIComponent(cat.slug)}`
            : `/products?categoryId=${cat.id}`;

          return (
            <Link
              key={cat.slug || cat.id || idx}
              href={targetHref}
              className="group flex flex-col items-center text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl p-2 transition-transform active:scale-95"
            >
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:-translate-y-1.5 transition-all duration-300 ${colorClass}`}
              >
                <IconComponent className="w-7 h-7 sm:w-9 sm:h-9 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="mt-2.5 text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-primary transition-colors line-clamp-1">
                {cat.nameFa}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryCircles;
