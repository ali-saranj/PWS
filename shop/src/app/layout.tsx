import { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { BRAND } from '@/config/branding';
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  serializeJsonLd,
} from '@/lib/jsonLd';

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.domain),
  title: {
    default: BRAND.titleFa,
    template: `%s | ${BRAND.nameFa}`,
  },
  description:
    'فروشگاه تخصصی پروتئین ایرانی در اصفهان؛ عرضه مستقیم و روزانه انواع سوسیس، کالباس و ژامبون ممتاز، پنیر پیتزا و گودا، سس‌های مخصوص، ترشیجات و خیارشور با ارسال سریع و بسته‌بندی عایق.',
  keywords: [
    BRAND.nameFa,
    BRAND.nameEn,
    'پروتئین ایرانی اصفهان',
    'سوسیس و کالباس اصفهان',
    'خرید ژامبون اصفهان',
    'پنیر پیتزا و گودا',
    'خیارشور و ترشیجات',
    'سس و چاشنی',
    'فروشگاه پروتئینی رهنان',
  ],
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: BRAND.domain,
    siteName: BRAND.nameFa,
    title: BRAND.titleFa,
    description:
      'پروتئین ایرانی (اصفهان) - خرید آنلاین انواع سوسیس، کالباس، پنیرهای فرآوری‌شده، سس‌ها، خیارشور و ترشیجات با ارسال سریع.',
  },
  other: {
    enamad: '13642013',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();

  return (
    <html lang="fa" dir="rtl">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(websiteSchema),
          }}
        />
        <script
          src="https://cdn.kavenegar.com/sdk/page.js?appId=0b42b71e-bd07-404f-9b84-669c4d262228"
          defer
          charSet="utf-8"
        />
        <script
          src="https://tabapay.ir/payments/trust"
          type="text/javascript"
          async
        />
      </head>
      <body className="min-h-screen flex flex-col font-vazirmatn bg-gray-50 text-gray-900 selection:bg-primary/20 selection:text-primary-dark">
        <Suspense fallback={<div className="h-16 bg-white border-b border-gray-100 shadow-sm" />}>
          <Header />
        </Suspense>
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
