'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
} from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import { api } from '@/lib/api';
import { toPersianDigits } from '@/lib/format';

interface CallbackResult {
  success: boolean;
  trackingCode?: string;
  orderNumber?: string;
  refId?: string;
  message?: string;
}

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const authority = searchParams.get('Authority') || '';
  const tokenOrAuth = token || authority;
  const statusParam = searchParams.get('status') || searchParams.get('Status') || '';
  const responseCode = searchParams.get('responseCode');

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<CallbackResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verifyPayment() {
      // If user cancelled or gateway returned failure immediately
      if (
        statusParam.toUpperCase() === 'NOK' ||
        statusParam.toLowerCase() === 'error' ||
        (responseCode !== null && responseCode !== '1')
      ) {
        if (isMounted) {
          setResult({
            success: false,
            message: 'تراکنش ناموفق بود یا توسط کاربر لغو شد.',
          });
          setIsLoading(false);
        }
        return;
      }

      // Verify with unified backend payment callback endpoint
      try {
        const query = searchParams.toString() || new URLSearchParams({
          token: tokenOrAuth,
          Authority: tokenOrAuth,
          Status: statusParam || 'OK',
        }).toString();

        const data = await api.get<{
          success: boolean;
          trackingCode?: string;
          orderNumber?: string;
          refId?: string;
          message?: string;
        }>(`/api/shop/payments/callback?${query}`);

        if (isMounted) {
          if (data && data.success && data.trackingCode && data.orderNumber) {
            // Clear cart on successful order confirmation
            useCartStore.getState().clearCart();
            setResult({
              success: true,
              trackingCode: data.trackingCode,
              orderNumber: data.orderNumber,
              refId: data.refId || tokenOrAuth,
            });
          } else {
            setResult({
              success: false,
              message: data?.message || 'تراکنش ناموفق بود یا تایید نشد.',
            });
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setResult({
            success: false,
            message:
              'خطا در ارتباط با سرور و تایید تراکنش. اگر مبلغی از حساب شما کسر شده است، ظرف حداکثر ۷۲ ساعت آینده بازگردانده خواهد شد. با پشتیبانی تماس بگیرید.',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [authority, statusParam]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <h2 className="text-lg font-bold text-gray-800">در حال تایید تراکنش بانکی...</h2>
        <p className="text-sm text-gray-500 mt-2">لطفاً چند لحظه شکیبا باشید.</p>
      </div>
    );
  }

  // Failed state
  if (!result || !result.success) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4">
        <div className="bg-white border border-red-100 rounded-3xl p-6 sm:p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">پرداخت ناموفق</h2>
          <p className="text-sm text-red-600 font-medium mb-6">
            {result?.message || 'تراکنش ناموفق بود یا توسط کاربر لغو شد.'}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed mb-8">
            در صورتی که مبلغی از حساب شما کسر شده است، ظرف حداکثر ۷۲ ساعت آینده توسط شبکه شاپرک
            به حسابتان بازگردانده خواهد شد.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              تلاش مجدد برای پرداخت
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              بازگشت به فروشگاه
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="max-w-xl mx-auto my-12 px-4">
      <div className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-sm text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-emerald-800 mb-1">پرداخت با موفقیت انجام شد</h2>
        <p className="text-sm text-gray-500 mb-6">
          سفارش شما با موفقیت ثبت شد و برای پروتئینی جهت آماده‌سازی ارسال گردید.
        </p>

        {/* Order Details Card */}
        <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 mb-8 text-right space-y-3 border border-gray-100">
          <div className="flex justify-between items-center text-sm py-1 border-b border-gray-200/60">
            <span className="text-gray-500">شماره سفارش:</span>
            <span className="font-bold text-gray-800 font-mono">{result.orderNumber}</span>
          </div>
          <div className="flex justify-between items-center text-sm py-1 border-b border-gray-200/60">
            <span className="text-gray-500">کد پیگیری سفارش:</span>
            <span className="font-bold text-emerald-700 font-mono tracking-wider">{result.trackingCode}</span>
          </div>
          {result.refId && (
            <div className="flex justify-between items-center text-sm py-1">
              <span className="text-gray-500">شماره پیگیری زرین‌پال:</span>
              <span className="font-semibold text-gray-700 font-mono">{result.refId}</span>
            </div>
          )}
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/track/${result.trackingCode}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
          >
            <PackageCheck className="w-4 h-4" />
            پیگیری وضعیت سفارش
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all"
          >
            بازگشت به فروشگاه
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
