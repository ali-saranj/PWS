import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { BRAND } from '@/config/branding';

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.domain),
  title: {
    default: BRAND.titleFa,
    template: `%s | ${BRAND.nameFa}`,
  },
  description:
    'فروشگاه آنلاین تخصصی انواع سوسیس، کالباس، فرآورده‌های پروتئینی، پنیرها، چاشنی‌ها و اقلام مرغوب با ارسال فوری و بسته‌بندی عایق.',
  keywords: [
    BRAND.nameFa,
    BRAND.nameEn,
    'سوپرمارکت آنلاین پروتئینی',
    'سوسیس و کالباس',
    'فرآورده‌های پروتئینی',
    'ژامبون',
    'خرید سوسیس و کالباس',
    'پنیر پیتزا و گودا',
  ],
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: BRAND.domain,
    siteName: BRAND.nameFa,
    title: BRAND.titleFa,
    description:
      'فروشگاه آنلاین تخصصی انواع سوسیس، کالباس، فرآورده‌های پروتئینی و اقلام تازه.',
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
  return (
    <html lang="fa" dir="rtl">
      <head>
        <script
          src="https://cdn.kavenegar.com/sdk/page.js?appId=0b42b71e-bd07-404f-9b84-669c4d262228"
          defer
          charSet="utf-8"
        />
      </head>
      <body className="min-h-screen flex flex-col font-vazirmatn bg-gray-50 text-gray-900 selection:bg-primary/20 selection:text-primary-dark">
        <Header />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
