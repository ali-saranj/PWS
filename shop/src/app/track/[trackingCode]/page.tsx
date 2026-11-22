'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Package,
  MapPin,
  Phone,
  Headphones,
  Calendar,
  CreditCard,
  User,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { OrderTrackingTimeline, TrackingStatus, TimelineEvent } from '@/components/OrderTrackingTimeline';
import { api } from '@/lib/api';
import { toPersianDigits } from '@/lib/format';
import { BRAND } from '@/config/branding';

export interface OrderItemTrackDto {
  productNameFa: string;
  productNameEn?: string;
  variantLabelFa?: string;
  variantLabelEn?: string;
  qty: number;
  imageUrl?: string;
}

export interface OrderTrackingDto {
  trackingCode: string;
  orderNumber: string;
  status: TrackingStatus | string;
  placedAt?: string;
  paidAt?: string;
  recipientNameMasked: string;
  recipientMobileMasked: string;
  province: string;
  city: string;
  items: OrderItemTrackDto[];
  timeline: TimelineEvent[];
  courierNotes?: string;
}

interface PageProps {
  params: Promise<{ trackingCode: string }>;
}

export default function OrderTrackingPage({ params }: PageProps) {
  const [trackingCode, setTrackingCode] = useState<string>('');
  const [data, setData] = useState<OrderTrackingDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function resolveParams() {
      if (params) {
        if (typeof (params as any)?.then === 'function') {
          const resolved = await params;
          if (active) setTrackingCode(resolved.trackingCode);
        } else {
          setTrackingCode((params as unknown as { trackingCode: string }).trackingCode || '');
        }
      }
    }

    resolveParams();
    return () => {
      active = false;
    };
  }, [params]);

  useEffect(() => {
    if (!trackingCode) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function fetchTracking() {
      try {
        const res = await api.get<OrderTrackingDto>(
          `/api/shop/orders/track/${encodeURIComponent(trackingCode)}`
        );
        if (isMounted) {
          setData(res);
        }
      } catch (err: any) {
        if (isMounted) {
          setData(null);
          setError('سفارش با این کد رهگیری یافت نشد.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchTracking();

    return () => {
      isMounted = false;
    };
  }, [trackingCode]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
        <h2 className="text-base font-bold text-gray-700">در حال دریافت آخرین وضعیت سفارش...</h2>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4 text-center">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">سفارش یافت نشد</h2>
          <p className="text-sm text-gray-500 mb-6">
            سفارش با این کد رهگیری یافت نشد. لطفاً کد را مجدداً بررسی فرمایید.
          </p>
          <Link
            href="/track"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all"
          >
            جستجوی مجدد کد پیگیری
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header card with order number & tracking code */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">پیگیری سفارش</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            مشاهده لحظه‌ای وضعیت آماده‌سازی، برش و ارسال سفارش
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 sm:p-4 text-left sm:text-right flex flex-col gap-1">
          <div className="flex items-center gap-2 justify-between">
            <span className="text-xs text-gray-500">شماره سفارش:</span>
            <span className="text-sm font-bold text-gray-800 font-mono">{data.orderNumber}</span>
          </div>
          <div className="flex items-center gap-2 justify-between">
            <span className="text-xs text-gray-500">کد پیگیری:</span>
            <span className="text-sm font-black text-emerald-700 font-mono tracking-wider">
              {data.trackingCode}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Timeline Tracker */}
      <OrderTrackingTimeline
        status={data.status}
        timeline={data.timeline}
        courierNotes={data.courierNotes}
      />

      {/* Two columns: Delivery Info & Customer Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recipient & Delivery Information */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-gray-800 font-bold text-base pb-3 border-b border-gray-100">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h3>اطلاعات گیرنده و آدرس ارسال</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">نام تحویل‌گیرنده:</span>
              <span className="font-semibold text-gray-800">{data.recipientNameMasked}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">شماره موبایل:</span>
              <span className="font-semibold text-gray-800 font-mono">{data.recipientMobileMasked}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">مقصد ارسال:</span>
              <span className="font-semibold text-gray-800">
                {data.province} - {data.city}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Support & Help */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-800 font-bold text-base pb-3 border-b border-gray-100">
              <Headphones className="w-5 h-5 text-emerald-600" />
              <h3>پشتیبانی مشتریان</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mt-3">
              در صورت بروز هرگونه سوال پیرامون زمان تحویل، تغییر آدرس یا جزئیات سفارش، کارشناسان پشتیبانی
              پروتئین ایرانی پاسخگوی شما هستند.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href={`tel:${BRAND.phoneRaw}`}
              className="flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition-all"
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <Phone className="w-4 h-4 text-emerald-700" />
                <span>تماس مستقیم با پشتیبانی</span>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-900">{BRAND.phoneFa}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Ordered Items Table */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-gray-800 font-bold text-base pb-3 border-b border-gray-100">
          <Package className="w-5 h-5 text-emerald-600" />
          <h3>اقلام سفارش</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {data.items && data.items.length > 0 ? (
            data.items.map((item, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200/50">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productNameFa}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-800">{item.productNameFa}</h4>
                    {item.variantLabelFa && (
                      <span className="inline-block text-xs text-gray-500 mt-0.5">
                        {item.variantLabelFa}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-left font-mono">
                  <span className="text-xs text-gray-500 ml-1">تعداد:</span>
                  <span className="font-bold text-sm text-gray-800">{toPersianDigits(item.qty)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 py-3">اطلاعات اقلام ثبت نشده است.</p>
          )}
        </div>
      </div>

      {/* Back button */}
      <div className="text-center pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-700 font-semibold transition-colors"
        >
          بازگشت به صفحه اصلی فروشگاه
        </Link>
      </div>
    </div>
  );
}
