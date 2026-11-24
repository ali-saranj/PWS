import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import TermsPage, { metadata as termsMeta } from './terms/page';
import PrivacyPage, { metadata as privacyMeta } from './privacy/page';
import ReturnsPage, { metadata as returnsMeta } from './returns/page';
import FaqPage, { metadata as faqMeta } from './faq/page';
import HowToOrderPage, { metadata as howToOrderMeta } from './how-to-order/page';
import PaymentMethodsPage, { metadata as paymentMethodsMeta } from './payment-methods/page';
import ShippingPage, { metadata as shippingMeta } from './shipping/page';
import WholesalePage, { metadata as wholesaleMeta } from './wholesale/page';

describe('Customer Trust & Policy Pages', () => {
  it('renders TermsPage with title, sections, contact info, and valid canonical', () => {
    render(<TermsPage />);
    expect(screen.getByRole('heading', { level: 1, name: /قوانین و مقررات خرید اینترنتی/i })).toBeInTheDocument();
    expect(screen.getByText(/ماده اول: تعاریف و کلیات/i)).toBeInTheDocument();
    expect(termsMeta.title).toBe('قوانین و مقررات خرید');
    expect(termsMeta.alternates?.canonical).toBe('https://proteinirany.ir/terms');
  });

  it('renders PrivacyPage with title, sections, and valid canonical', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { level: 1, name: /سیاست حریم خصوصی کاربران/i })).toBeInTheDocument();
    expect(screen.getByText(/امنیت و محرمانگی داده‌ها/i)).toBeInTheDocument();
    expect(privacyMeta.title).toBe('حریم خصوصی کاربران');
    expect(privacyMeta.alternates?.canonical).toBe('https://proteinirany.ir/privacy');
  });

  it('renders ReturnsPage with title, sections, and valid canonical', () => {
    render(<ReturnsPage />);
    expect(screen.getByRole('heading', { level: 1, name: /رویه‌های بازگرداندن و ضمانت کیفیت کالا/i })).toBeInTheDocument();
    expect(screen.getByText(/شرایط ویژه کالاهای پروتئینی و فاسدشدنی/i)).toBeInTheDocument();
    expect(returnsMeta.title).toBe('رویه‌های بازگرداندن کالا');
    expect(returnsMeta.alternates?.canonical).toBe('https://proteinirany.ir/returns');
  });

  it('renders FaqPage with questions and valid canonical', () => {
    render(<FaqPage />);
    expect(screen.getByRole('heading', { level: 1, name: /پرسش‌های متداول مشتریان/i })).toBeInTheDocument();
    expect(screen.getByText(/سفارشات چگونه و با چه کیفیتی در اصفهان ارسال می‌شوند؟/i)).toBeInTheDocument();
    expect(faqMeta.title).toBe('پرسش‌های متداول');
    expect(faqMeta.alternates?.canonical).toBe('https://proteinirany.ir/faq');
  });

  it('renders HowToOrderPage with steps and valid canonical', () => {
    render(<HowToOrderPage />);
    expect(screen.getByRole('heading', { level: 1, name: /راهنمای ثبت سفارش آنلاین/i })).toBeInTheDocument();
    expect(screen.getByText(/۱\. انتخاب محصولات و وزن درخواستی/i)).toBeInTheDocument();
    expect(howToOrderMeta.title).toBe('نحوه ثبت سفارش آنلاین');
    expect(howToOrderMeta.alternates?.canonical).toBe('https://proteinirany.ir/how-to-order');
  });

  it('renders PaymentMethodsPage with payment channels and valid canonical', () => {
    render(<PaymentMethodsPage />);
    expect(screen.getByRole('heading', { level: 1, name: /شیوه‌های پرداخت اینترنتی و امن/i })).toBeInTheDocument();
    expect(screen.getByText(/درگاه رسمی پرداخت شاپرک/i)).toBeInTheDocument();
    expect(paymentMethodsMeta.title).toBe('شیوه‌های پرداخت اینترنتی');
    expect(paymentMethodsMeta.alternates?.canonical).toBe('https://proteinirany.ir/payment-methods');
  });

  it('renders ShippingPage with cold-chain details and valid canonical', () => {
    render(<ShippingPage />);
    expect(screen.getByRole('heading', { level: 1, name: /بسته‌بندی و شیوه‌های ارسال/i })).toBeInTheDocument();
    expect(screen.getByText(/بسته‌بندی اختصاصی عایق دما/i)).toBeInTheDocument();
    expect(shippingMeta.title).toBe('بسته‌بندی و شیوه‌های ارسال');
    expect(shippingMeta.alternates?.canonical).toBe('https://proteinirany.ir/shipping');
  });

  it('renders WholesalePage with tiered discount details and valid canonical', () => {
    render(<WholesalePage />);
    expect(screen.getByRole('heading', { level: 1, name: /تامین عمده فست‌فودها، پیتزافروشی‌ها و اغذیه‌فروشی‌ها/i })).toBeInTheDocument();
    expect(screen.getByText(/سیستم تخفیف پلکانی خودکار/i)).toBeInTheDocument();
    expect(wholesaleMeta.title).toBe('خرید عمده و ساندویچی‌ها');
    expect(wholesaleMeta.alternates?.canonical).toBe('https://proteinirany.ir/wholesale');
  });
});
