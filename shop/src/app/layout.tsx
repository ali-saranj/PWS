import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'سبد سبز - سوپرمارکت آنلاین پروتئینی و مواد غذایی',
  description:
    'فروشگاه آنلاین انواع سوسیس، کالباس، فرآورده‌های گوشتی، پنیرها، چاشنی‌ها و اقلام سوپرمارکتی تازه با ارسال فوری و بسته‌بندی عایق در سراسر کشور.',
  keywords: [
    'سوپرمارکت آنلاین',
    'سبد سبز',
    'پروتئینی',
    'سوسیس و کالباس',
    'خرید گوشت',
    'ساندویچ',
    'مواد غذایی',
  ],
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
      <body className="min-h-screen flex flex-col font-vazirmatn bg-gray-50 text-gray-900 selection:bg-primary/20 selection:text-primary-dark">
        <Header />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
