'use client';

import React from 'react';
import Link from 'next/link';
import { BRAND } from '@/config/branding';
import {
  ShieldCheck,
  Truck,
  Headphones,
  CreditCard,
  Phone,
  Mail,
  Clock,
  Send,
  Store,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const [enamadSrc, setEnamadSrc] = React.useState('/images/enamad.png');

  React.useEffect(() => {
    const isCrawler =
      typeof navigator !== 'undefined' &&
      /Googlebot|Google-InspectionTool|bingbot|Baiduspider|YandexBot|DuckDuckBot/i.test(
        navigator.userAgent
      );
    if (!isCrawler) {
      setEnamadSrc(
        'https://trustseal.enamad.ir/logo.aspx?id=8617111&code=XI0dJOGnVVyu4yLlcGotBytDYzEADRgt'
      );
    }
  }, []);

  const trustBadges = [
    {
      icon: ShieldCheck,
      title: 'ضمانت اصالت و تازگی کالا',
      desc: 'کنترل کیفیت روزانه و تاریخ مصرف معتبر',
    },
    {
      icon: Truck,
      title: 'ارسال سریع با بسته‌بندی عایق',
      desc: 'حفظ دمای محصولات پروتئینی تا تحویل',
    },
    {
      icon: Headphones,
      title: 'پشتیبانی ۷ روزه تا ساعت ۲۴',
      desc: 'پاسخگویی سریع به کلیه سفارشات',
    },
    {
      icon: CreditCard,
      title: 'پرداخت امن با کلیه کارت‌های شتاب',
      desc: 'درگاه پرداخت شاپرک و زرین‌پال',
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 font-vazirmatn pt-12 pb-8 border-t border-gray-800">
      {/* Trust Badges Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustBadges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3.5 p-4 rounded-2xl bg-gray-800/60 border border-gray-700/50 hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{badge.title}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{badge.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info & Contacts */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-black text-xl text-white">
                {BRAND.titleFa}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              فروشگاه تخصصی مواد غذایی، فرآورده‌های پروتئینی، سوسیس و کالباس درجه یک،
              پنیرهای فرآوری‌شده، چاشنی‌ها و نان‌های ساندویچی با ارسال فوری به سراسر
              کشور و بسته‌بندی استاندارد بهداشتی.
            </p>
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="w-4 h-4 text-primary" />
                <span>تلفن پشتیبانی:</span>
                <span className="font-semibold text-white dir-ltr">
                  ۰۲۱-۸۸۸۸۹۹۹۹
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="w-4 h-4 text-primary" />
                <span>پست الکترونیک:</span>
                <span className="font-semibold text-white">
                  {BRAND.supportEmail}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Clock className="w-4 h-4 text-primary" />
                <span>ساعات کاری: همه روزه از ساعت ۸ الی ۲۴</span>
              </div>
            </div>
          </div>

          {/* Quick Links Column 1 */}
          <div className="space-y-3">
            <h5 className="font-bold text-sm text-white border-r-2 border-primary pr-2">
              خدمات مشتریان
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/faq"
                  className="hover:text-primary transition-colors text-gray-400"
                >
                  پرسش‌های متداول
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="hover:text-primary transition-colors text-gray-400"
                >
                  رویه‌های بازگرداندن کالا
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-primary transition-colors text-gray-400"
                >
                  قوانین و مقررات خرید
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-primary transition-colors text-gray-400"
                >
                  حریم خصوصی کاربران
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links Column 2 */}
          <div className="space-y-3">
            <h5 className="font-bold text-sm text-white border-r-2 border-primary pr-2">
              راهنمای خرید
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/how-to-order"
                  className="hover:text-primary transition-colors text-gray-400"
                >
                  نحوه ثبت سفارش آنلاین
                </Link>
              </li>
              <li>
                <Link
                  href="/payment-methods"
                  className="hover:text-primary transition-colors text-gray-400"
                >
                  شیوه‌های پرداخت اینترنتی
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="hover:text-primary transition-colors text-gray-400"
                >
                  بسته‌بندی و شیوه‌های ارسال
                </Link>
              </li>
              <li>
                <Link
                  href="/wholesale"
                  className="hover:text-primary transition-colors text-gray-400"
                >
                  خرید عمده و ساندویچی‌ها
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="space-y-3">
            <h5 className="font-bold text-sm text-white border-r-2 border-primary pr-2">
              خبرنامه تخفیف‌ها
            </h5>
            <p className="text-xs text-gray-400 leading-relaxed">
              از اولین نفراتی باشید که از تخفیف‌های ویژه و کدهای جایزه مطلع می‌شوید.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('با تشکر! عضویت شما در خبرنامه ثبت شد.');
              }}
              className="space-y-2"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="شماره موبایل یا ایمیل خود را وارد کنید..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>عضویت در خبرنامه</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Copyright & Trust Seal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <p className="text-xs text-gray-500 text-center sm:text-right">
          کلیه حقوق این وب‌سایت متعلق به سوپرمارکت آنلاین {BRAND.nameFa} می‌باشد. © ۲۰۲۶
        </p>

        {/* Certificates & Enamad */}
        <div className="flex items-center gap-4">
          <a
            referrerPolicy="origin"
            target="_blank"
            rel="noopener"
            href="https://trustseal.enamad.ir/?id=8617111&code=XI0dJOGnVVyu4yLlcGotBytDYzEADRgt"
            className="inline-flex items-center justify-center p-2.5 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-105 border border-gray-100 group"
            title="نماد اعتماد الکترونیکی سبد سبز (پروتئین ایرانی)"
            aria-label="نماد اعتماد الکترونیکی"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              referrerPolicy="origin"
              src={enamadSrc}
              alt="نماد اعتماد الکترونیکی"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain cursor-pointer"
              loading="lazy"
              width={80}
              height={80}
              onError={() => setEnamadSrc('/images/enamad.png')}
            />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
