import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  fetchBrandBySlug,
  fetchCatalogProducts,
  fetchCategories,
} from '@/lib/serverCatalog';
import BrandShowcaseContent from './BrandShowcaseContent';

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await fetchBrandBySlug(slug);

  if (!brand) {
    return {
      title: 'برند یافت نشد | سبد سبز',
    };
  }

  const title = brand.nameEn
    ? `محصولات برند ${brand.nameFa} (${brand.nameEn}) | سبد سبز`
    : `محصولات برند ${brand.nameFa} | سبد سبز`;

  return {
    title,
    description: `خرید آنلاین انواع محصولات برند معتبر ${brand.nameFa} با تضمین کیفیت و ارسال روز در سوپرمارکت آنلاین سبد سبز`,
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const [brand, categories] = await Promise.all([
    fetchBrandBySlug(slug),
    fetchCategories(),
  ]);

  if (!brand) {
    notFound();
    return null;
  }

  const initialProducts = await fetchCatalogProducts({
    brandSlug: brand.slug,
    size: 48,
  });

  return (
    <BrandShowcaseContent
      brand={brand}
      initialProducts={initialProducts.content as any}
      categories={categories}
    />
  );
}
