import React from 'react';
import Link from 'next/link';
import {
  Layers,
  Flame,
  UtensilsCrossed,
  Apple,
  Salad,
  Sandwich,
  Cookie,
  Milk,
  Package,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';
import { fetchCategories, CategoryItem } from '@/lib/serverCatalog';

export const metadata = {
  title: 'دسته‌بندی‌های محصولات | سبد سبز',
  description: 'انواع فرآورده‌های پروتئینی، لبنیات، چاشنی‌ها و اقلام سوپرمارکتی در فروشگاه سبد سبز',
};

const categoryIconMap: Record<string, { icon: LucideIcon; color: string }> = {
  'sausages-hotdogs': { icon: Flame, color: 'from-amber-500 to-red-500' },
  'sausage-hotdog': { icon: Flame, color: 'from-amber-500 to-red-500' },
  'cold-cuts-deli': { icon: UtensilsCrossed, color: 'from-red-500 to-rose-600' },
  'ham-coldcuts': { icon: UtensilsCrossed, color: 'from-red-500 to-rose-600' },
  'sausages-coldcuts': { icon: Flame, color: 'from-red-500 to-rose-600' },
  'pickles-condiments': { icon: Apple, color: 'from-emerald-500 to-green-600' },
  'pickles': { icon: Apple, color: 'from-emerald-500 to-green-600' },
  'sauces': { icon: Salad, color: 'from-orange-500 to-amber-600' },
  'sauces-condiments': { icon: Salad, color: 'from-orange-500 to-amber-600' },
  'sandwich-bread': { icon: Sandwich, color: 'from-yellow-600 to-amber-700' },
  'bread': { icon: Sandwich, color: 'from-yellow-600 to-amber-700' },
  'chips-snacks': { icon: Cookie, color: 'from-purple-500 to-pink-500' },
  'snacks-chips': { icon: Cookie, color: 'from-purple-500 to-pink-500' },
  'dairy-cheese': { icon: Milk, color: 'from-blue-500 to-indigo-600' },
  'dairy': { icon: Milk, color: 'from-blue-500 to-indigo-600' },
  'canned-goods': { icon: Package, color: 'from-teal-500 to-emerald-600' },
  'canned-food': { icon: Package, color: 'from-teal-500 to-emerald-600' },
};

function getCategoryVisual(slug: string) {
  if (categoryIconMap[slug]) {
    return categoryIconMap[slug];
  }
  return { icon: Layers, color: 'from-emerald-600 to-teal-700' };
}

interface CategoryWithChildren extends CategoryItem {
  children: CategoryItem[];
}

export default async function CategoriesPage() {
  const allCategories = await fetchCategories();

  // Build hierarchy: root categories and direct children
  const categoryMap = new Map<number, CategoryItem>();
  allCategories.forEach((cat) => categoryMap.set(cat.id, cat));

  const roots: CategoryWithChildren[] = [];
  const childrenByParent = new Map<number, CategoryItem[]>();

  allCategories.forEach((cat) => {
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      const list = childrenByParent.get(cat.parentId) || [];
      list.push(cat);
      childrenByParent.set(cat.parentId, list);
    }
  });

  allCategories.forEach((cat) => {
    if (!cat.parentId || !categoryMap.has(cat.parentId)) {
      roots.push({
        ...cat,
        children: childrenByParent.get(cat.id) || [],
      });
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-vazirmatn">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          صفحه اصلی
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">دسته‌بندی‌های محصولات</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">دسته‌بندی‌های سبد سبز</h1>
        <p className="text-gray-500 text-sm">
          انواع فرآورده‌های پروتئینی، لبنیات، چاشنی‌ها و اقلام سوپرمارکتی تازه و معتبر
        </p>
      </div>

      {roots.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-800 mb-1">
            در حال حاضر دسته‌بندی فعالی وجود ندارد
          </h2>
          <p className="text-sm text-gray-500">
            لطفاً بعداً مراجعه کنید یا به صفحه اصلی بازگردید.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-2.5 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            بازگشت به صفحه اصلی
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roots.map((root) => {
            const visual = getCategoryVisual(root.slug);
            const Icon = visual.icon;

            return (
              <div
                key={root.id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${visual.color} flex items-center justify-center text-white shadow-md`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{root.nameFa}</h2>
                      {root.nameEn && (
                        <span className="text-xs text-gray-400 font-medium">{root.nameEn}</span>
                      )}
                    </div>
                  </div>

                  {root.children.length > 0 && (
                    <div className="mb-6">
                      <span className="text-xs font-semibold text-gray-400 block mb-2">
                        زیردسته‌ها:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {root.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/products?categoryId=${child.id}`}
                            className="text-xs px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-primary/10 hover:text-primary text-gray-700 transition-colors border border-gray-100"
                          >
                            {child.nameFa}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href={`/products?categoryId=${root.id}`}
                  className="mt-2 inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-primary/10 text-gray-700 hover:text-primary transition-colors text-xs font-semibold"
                >
                  <span>مشاهده همه محصولات {root.nameFa}</span>
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
