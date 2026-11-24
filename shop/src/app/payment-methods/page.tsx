import React from 'react';
import type { Metadata } from 'next';
import { BRAND } from '@/config/branding';
import { TrustPageContainer } from '@/components/TrustPageContainer';
import { CreditCard, ShieldCheck, Building2, Smartphone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'شیوه‌های پرداخت اینترنتی',
  description: `روش‌های امن پرداخت اینترنتی از طریق درگاه‌های عضو شتاب، تاباپی و کارت به کارت در ${BRAND.nameFa}.`,
  alternates: {
    canonical: `${BRAND.domain}/payment-methods`,
  },
};

export default function PaymentMethodsPage() {
  return (
    <TrustPageContainer
      title="شیوه‌های پرداخت اینترنتی و امن"
      subtitle={`راهنمای روش‌های تسویه حساب و پرداخت امن در فروشگاه پروتئین ایرانی`}
      badge="پرداخت امن شاپرک"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-gray-50/80 border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-2">درگاه رسمی پرداخت شاپرک</h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              پرداخت آنی و امن با کلیه کارت‌های بانکی عضو شبکه شتاب با استفاده از رمز دوم پویا (رمز پیامکی) بدون کارمزد اضافی.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>پشتیبانی از تمامی بانک‌های کشور</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gray-50/80 border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-2">تسویه حساب ویژه سفارشات عمده</h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              برای خریدهای عمده فست‌فودها، ساندویچی‌ها و سفارشات تکرارشونده، هماهنگی حواله بانکی، ساتنا، پایا و ارائه فاکتور رسمی از طریق واحد مالی امکان‌پذیر است.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center gap-2 text-xs text-primary font-semibold">
            <Smartphone className="w-4 h-4" />
            <span>هماهنگی با پشتیبانی عمده: {BRAND.phoneFa}</span>
          </div>
        </div>
      </div>
    </TrustPageContainer>
  );
}
