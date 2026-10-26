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
  'sausage-hotdog': Beef,
  'ham-coldcuts': UtensilsCrossed,
  'pickles': Apple,
  'sauces-condiments': Salad,
  'bread': Sandwich,
  'snacks-chips': Cookie,
  'canned-food': Package,
  'dairy-cheese': Milk,
};

export interface CategoryCirclesProps {
  categories?: CategoryItem[];
}

export const CategoryCircles: React.FC<CategoryCirclesProps> = ({
  categories = DEFAULT_CATEGORIES,
}) => {
  const items = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <section className="py-4" aria-label="دسته‌بندی‌های اصلی">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span>دسته‌بندی‌های محبوب</span>
        </h2>
        <Link
          href="/category/all"
          className="text-xs sm:text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
        >
          مشاهده تمام دسته‌ها
        </Link>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4">
        {items.map((cat, idx) => {
          const IconComponent = categoryIconMap[cat.slug] || UtensilsCrossed;
          const colorClass =
            cat.color ||
            DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length].color ||
            'bg-emerald-50 text-emerald-600 border-emerald-200/60 group-hover:bg-emerald-500 group-hover:text-white';

          return (
            <Link
              key={cat.slug || cat.id || idx}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl p-2 transition-transform active:scale-95"
            >
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:-translate-y-1.5 transition-all duration-300 ${colorClass}`}
              >
                <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 transition-transform duration-300 group-hover:scale-110" />
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
