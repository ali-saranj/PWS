import React from 'react';
import Link from 'next/link';
import { Award } from 'lucide-react';

const BRANDS = [
  { slug: 'andre', nameFa: 'آندره', nameEn: 'Andre', desc: 'تولیدکننده انواع ژامبون، سوسیس و کالباس درجه یک ممتاز' },
  { slug: 'brand-202', nameFa: '۲۰۲', nameEn: '202', desc: 'فرآورده‌های گوشتی، سوسیس فرانکفورتر و هات‌داگ پنیری' },
  { slug: 'yek-o-yek', nameFa: 'یک‌و‌یک', nameEn: 'Yek O Yek', desc: 'خیارشور ویژه، ترشیجات، کنسرو و رب گوجه‌فرنگی سنتی' },
  { slug: 'delpazir', nameFa: 'دلپذیر', nameEn: 'Delpazir', desc: 'انواع سس مایونز، کچاپ، فرانسوی و چاشنی‌های معتبر غذایی' },
  { slug: 'kalleh', nameFa: 'کاله', nameEn: 'Kalleh', desc: 'انواع پنیر موزارلا، گودا، ماست و فرآورده‌های پروتئینی لبنی' },
];

export default function BrandsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-vazirmatn">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          صفحه اصلی
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">برندهای همکار</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">برندهای معتبر و ممتاز در سبد سبز</h1>
        <p className="text-gray-500 text-sm">
          تضمین کیفیت و اصالت تمامی کالاهای برندهای معتبر با تاریخ تولید روز
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {BRANDS.map((b) => (
          <div
            key={b.slug}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black text-gray-900">{b.nameFa}</span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary-dark">
                  {b.nameEn}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">{b.desc}</p>
            </div>

            <Link
              href={`/search?q=${encodeURIComponent(b.nameFa)}`}
              className="w-full py-2.5 rounded-xl border border-primary text-primary hover:bg-primary hover:text-white transition-colors text-sm font-semibold text-center block"
            >
              مشاهده محصولات {b.nameFa}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
