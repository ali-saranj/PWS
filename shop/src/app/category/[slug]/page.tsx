import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  fetchCategoryBySlug,
  fetchCatalogProducts,
  fetchBrands,
  fetchCategories,
} from '@/lib/serverCatalog';
import CategoryShowcaseContent from './CategoryShowcaseContent';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'دسته‌بندی یافت نشد | سبد سبز',
    };
  }

  const title = category.nameEn
    ? `خرید انواع ${category.nameFa} (${category.nameEn}) | سبد سبز`
    : `خرید انواع ${category.nameFa} | سبد سبز`;

  return {
    title,
    description: `خرید آنلاین و مشخصات انواع ${category.nameFa} با کیفیت عالی، تاریخ تولید روز و ارسال سریع در فروشگاه سبد سبز`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const [category, brands, categories] = await Promise.all([
    fetchCategoryBySlug(slug),
    fetchBrands(),
    fetchCategories(),
  ]);

  if (!category) {
    notFound();
    return null;
  }

  const initialProducts = await fetchCatalogProducts({
    categorySlug: category.slug,
    size: 48,
  });

  return (
    <CategoryShowcaseContent
      category={category}
      initialProducts={initialProducts.content}
      brands={brands}
      categories={categories}
    />
  );
}
