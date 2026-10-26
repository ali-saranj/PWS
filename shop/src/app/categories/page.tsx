import React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';

const CATEGORIES = [
  { slug: 'sausages-hotdogs', name: 'سوسیس و هات‌داگ', count: '۱۲ محصول', icon: '🌭', color: 'from-amber-500 to-red-500' },
  { slug: 'cold-cuts-deli', name: 'کالباس و ژامبون', count: '۱۸ محصول', icon: '🥩', color: 'from-red-500 to-rose-600' },
  { slug: 'pickles-condiments', name: 'خیارشور و ترشیجات', count: '۹ محصول', icon: '🥒', color: 'from-emerald-500 to-green-600' },
  { slug: 'sauces', name: 'سس و چاشنی', count: '۱۵ محصول', icon: '🥫', color: 'from-orange-500 to-amber-600' },
  { slug: 'sandwich-bread', name: 'نان ساندویچی و برگر', count: '۸ محصول', icon: '🥖', color: 'from-yellow-600 to-amber-700' },
  { slug: 'chips-snacks', name: 'چیپس و تنقلات', count: '۲۴ محصول', icon: '🍿', color: 'from-purple-500 to-pink-500' },
  { slug: 'dairy-cheese', name: 'لبنیات و پنیر پیتزا', count: '۱۶ محصول', icon: '🧀', color: 'from-blue-500 to-indigo-600' },
  { slug: 'canned-goods', name: 'کنسروجات و غذاهای آماده', count: '۱۴ محصول', icon: '🥫', color: 'from-teal-500 to-emerald-600' },
];

export default function CategoriesPage() {
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
          انواع فرآورده‌های پروتئینی، لبنیات، چاشنی‌ها و اقلام سوپرمارکتی
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col items-center text-center"
          >
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-4xl shadow-md group-hover:scale-110 transition-transform mb-4`}>
              {cat.icon}
            </div>
            <h2 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors mb-1">
              {cat.name}
            </h2>
            <span className="text-xs text-gray-400 font-medium">{cat.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
