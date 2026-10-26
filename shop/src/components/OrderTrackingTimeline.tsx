'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Truck,
  PackageCheck,
  ChefHat,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { toPersianDigits } from '@/lib/format';

export type TrackingStatus =
  | 'PENDING_PAYMENT'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'PREPARING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface TimelineEvent {
  status: TrackingStatus | string;
  timestamp: string;
  note?: string;
}

interface OrderTrackingTimelineProps {
  status: TrackingStatus | string;
  timeline?: TimelineEvent[];
  courierNotes?: string;
}

interface MilestoneStep {
  id: number;
  label: string;
  sublabel: string;
}

const MILESTONES: MilestoneStep[] = [
  { id: 1, label: 'ثبت و پرداخت سفارش', sublabel: 'پرداخت تایید شد' },
  { id: 2, label: 'تایید ادمین', sublabel: 'بررسی فاکتور و اقلام' },
  { id: 3, label: 'در حال آماده‌سازی و برش', sublabel: 'برش و بسته‌بندی در پروتئینی' },
  { id: 4, label: 'تحویل به پیک و ارسال', sublabel: 'ارسال با پیک عایق' },
  { id: 5, label: 'تحویل داده شد', sublabel: 'تحویل به مشتری' },
];

function getActiveStepIndex(status: string): number {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 0;
    case 'AWAITING_APPROVAL':
      return 1;
    case 'APPROVED':
      return 2;
    case 'PREPARING':
      return 2;
    case 'DISPATCHED':
      return 3;
    case 'DELIVERED':
      return 4;
    default:
      return 1;
  }
}

export function OrderTrackingTimeline({
  status,
  timeline = [],
  courierNotes,
}: OrderTrackingTimelineProps) {
  const isCancelled = status === 'CANCELLED';
  const activeStepIdx = getActiveStepIndex(status);

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return iso;
      // Persian formatted date and time
      const datePart = date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const timePart = date.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${datePart} - ساعت ${timePart}`;
    } catch {
      return toPersianDigits(iso);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Cancellation Banner */}
      {isCancelled ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-800 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-base text-red-900">وضعیت سفارش: لغو شده</h4>
            <p className="text-sm text-red-700 leading-relaxed">
              این سفارش لغو شده است. مبلغ پرداختی به حساب خریدار بازگشت داده شد یا در حال بازگشت است و موجودی محصولات به انبار مرجوع شد.
            </p>
          </div>
        </div>
      ) : (
        /* Progress Bar / Milestone Tracker */
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 mb-6">وضعیت پردازش سفارش</h3>

          {/* Desktop/Tablet Horizontal Stepper */}
          <div className="relative hidden md:flex items-start justify-between">
            {/* Connecting line */}
            <div className="absolute top-5 right-8 left-8 h-1 bg-gray-200 -z-0" />
            <div
              className="absolute top-5 right-8 h-1 bg-emerald-500 transition-all duration-500 -z-0"
              style={{
                width: `${(Math.min(activeStepIdx, MILESTONES.length - 1) / (MILESTONES.length - 1)) * 100}%`,
              }}
            />

            {MILESTONES.map((step, idx) => {
              const isPassed = idx < activeStepIdx || (idx === MILESTONES.length - 1 && status === 'DELIVERED');
              const isCurrent = idx === activeStepIdx && status !== 'DELIVERED';

              return (
                <div key={step.id} className="flex flex-col items-center text-center z-10 w-28">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                      isPassed
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                        : 'bg-white border-2 border-gray-300 text-gray-400'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : isCurrent ? (
                      <Clock className="w-5 h-5 text-white animate-pulse" />
                    ) : (
                      toPersianDigits(step.id)
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold mt-2.5 leading-snug ${
                      isPassed ? 'text-emerald-700' : isCurrent ? 'text-amber-800' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1">{step.sublabel}</span>
                </div>
              );
            })}
          </div>

          {/* Mobile Vertical Stepper */}
          <div className="md:hidden space-y-4">
            {MILESTONES.map((step, idx) => {
              const isPassed = idx < activeStepIdx || (idx === MILESTONES.length - 1 && status === 'DELIVERED');
              const isCurrent = idx === activeStepIdx && status !== 'DELIVERED';

              return (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isPassed
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-amber-500 text-white ring-2 ring-amber-100'
                          : 'bg-gray-100 border border-gray-300 text-gray-400'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        toPersianDigits(step.id)
                      )}
                    </div>
                    {idx < MILESTONES.length - 1 && (
                      <div
                        className={`w-0.5 h-6 mt-1 ${
                          idx < activeStepIdx ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                  <div className="pt-0.5">
                    <h4
                      className={`text-sm font-bold ${
                        isPassed ? 'text-emerald-800' : isCurrent ? 'text-amber-700' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">{step.sublabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Courier notes when DISPATCHED or DELIVERED */}
      {(status === 'DISPATCHED' || status === 'DELIVERED' || !!courierNotes) && courierNotes && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-blue-900">
          <Truck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-blue-950">اطلاعات ارسال و پیک</h4>
            <p className="text-xs sm:text-sm text-blue-800 leading-relaxed font-medium">
              {courierNotes}
            </p>
          </div>
        </div>
      )}

      {/* Chronological Status History Events */}
      {timeline.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">تاریخچه تغییرات وضعیت</h3>
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div key={index} className="flex items-start gap-3 border-r-2 border-emerald-500 pr-3 py-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  {event.note && (
                    <p className="text-sm text-gray-800 font-medium leading-relaxed">{event.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderTrackingTimeline;
