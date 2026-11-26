import React from 'react';
import type { Metadata } from 'next';
import { BRAND } from '@/config/branding';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  title: {
    absolute: `فروشگاه پروتئینی | ${BRAND.nameFa}`,
  },
  description:
    'فروشگاه پروتئینی «پروتئین ایرانی» در اصفهان؛ خرید آنلاین فرآورده‌های پروتئینی، سوسیس و کالباس، ژامبون و بیکن، پنیر پیتزا و گودا، سس و خیارشور با ارسال سریع و زنجیره سرد.',
  openGraph: {
    title: `فروشگاه پروتئینی | ${BRAND.nameFa}`,
    description:
      'فروشگاه پروتئینی «پروتئین ایرانی» در اصفهان؛ خرید آنلاین سوسیس و کالباس، ژامبون و بیکن، پنیر پیتزا، سس و خیارشور با بسته‌بندی عایق و ارسال سریع.',
  },
  alternates: {
    canonical: `${BRAND.domain}/`,
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
