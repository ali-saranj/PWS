'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/cartStore';
import { formatToman, toPersianDigits } from '@/lib/format';
import {
  ChevronDown,
  RotateCcw,
  ExternalLink,
  Package,
  MapPin,
  Truck,
  Phone,
  User,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';

export interface OrderItem {
  variantId: number;
  productId: number;
  productTitle: string;
  portionLabel?: string;
  sku?: string;
  quantity: number;
  unitPriceRials?: number;
  unitPriceToman?: number;
  totalPriceToman?: number;
  imageUrl?: string;
}

export interface CustomerOrder {
  id: number;
  orderNumber: string;
  trackingCode?: string;
  status: string;
  statusLabelFa?: string;
  totalAmountRials?: number;
  totalAmountToman: number;
  shippingFeeRials?: number;
  shippingFeeToman?: number;
  deliveryAddress?: string;
  recipientName?: string;
  recipientMobile?: string;
  courierNotes?: string;
  createdAt?: string;
  createdAtJalali?: string;
  items: OrderItem[];
}

export interface ReorderAddedItem {
  productId: number;
  variantId: number;
  title: string;
  portionLabel: string;
  unitPriceToman?: number;
  priceToman?: number;
  quantity: number;
  maxStock?: number;
  imageUrl?: string;
}

export interface ReorderResult {
  addedItems: ReorderAddedItem[];
  unavailableItems: string[];
}

export interface OrdersTabProps {
  orders?: CustomerOrder[];
}

function getStatusBadge(status: string, customLabel?: string) {
  const norm = (status || '').toUpperCase();
  if (norm === 'DELIVERED') {
    return {
      label: customLabel || 'تحویل داده شده',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (norm === 'DISPATCHED') {
    return {
      label: customLabel || 'ارسال با پیک',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    };
  }
  if (norm === 'PROCESSING' || norm === 'PREPARING') {
    return {
      label: customLabel || 'در حال آماده‌سازی',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }
  if (norm === 'CANCELLED') {
    return {
      label: customLabel || 'لغو شده',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }
  return {
    label: customLabel || norm || 'در حال پردازش',
    className: 'bg-stone-50 text-stone-700 border-stone-200',
  };
}

export default function OrdersTab({ orders: initialOrders }: OrdersTabProps) {
  const [orders, setOrders] = useState<CustomerOrder[]>(initialOrders || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialOrders);
  const [error, setError] = useState<string | null>(null);

  // Accordion state: map orderId -> boolean
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  // 1-Click re-order loading state & feedback
  const [reorderingId, setReorderingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<CustomerOrder[]>('/api/shop/customer/orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.data?.message || 'خطا در دریافت لیست سفارش‌ها.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialOrders) {
      fetchOrders();
    } else {
      setOrders(initialOrders);
      setIsLoading(false);
    }
  }, [initialOrders, fetchOrders]);

  const toggleOrderAccordion = (orderId: number) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleReorder = async (order: CustomerOrder) => {
    setReorderingId(order.id);
    setFeedback(null);

    try {
      const result = await api.post<ReorderResult>(`/api/shop/customer/orders/${order.id}/reorder`);
      const { addItem, openCart } = useCartStore.getState();

      const added = result?.addedItems || [];
      const unavailable = result?.unavailableItems || [];

      if (added.length > 0) {
        added.forEach((item) => {
          addItem({
            id: `${item.productId}-${item.variantId}`,
            productId: item.productId,
            variantId: item.variantId,
            name: item.title,
            variantName: item.portionLabel,
            priceToman: item.unitPriceToman ?? item.priceToman ?? 0,
            quantity: item.quantity,
            maxStock: item.maxStock,
            imageUrl: item.imageUrl,
          });
        });
        openCart();
      }

      const countStr = toPersianDigits(added.length);
      if (unavailable.length === 0) {
        setFeedback({
          type: 'success',
          message: `${countStr} قلم کالا به سبد خرید اضافه شد.`,
        });
      } else {
        const unavailableList = unavailable.join('، ');
        setFeedback({
          type: 'warning',
          message: `${countStr} قلم کالا اضافه شد. اقلام ناموجود: ${unavailableList}`,
        });
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'خطا در ثبت مجدد سفارش.';
      setFeedback({
        type: 'error',
        message: msg,
      });
    } finally {
      setReorderingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800">تاریخچه سفارش‌ها</h2>
          <p className="text-sm text-stone-500 mt-1">
            مشاهده وضعیت سفارشات ثبت شده و امکان سفارش مجدد با یک کلیک
          </p>
        </div>
      </div>

      {/* Toast / Notification Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm transition-all shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : feedback.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            {feedback.type === 'warning' && (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            {feedback.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-75 hover:opacity-100 underline shrink-0 mr-auto"
          >
            بستن
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchOrders()}
            className="text-xs text-rose-700 font-semibold underline hover:text-rose-900 shrink-0"
          >
            تلاش مجدد
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div data-testid="orders-loading-skeleton" className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-100 shadow-sm animate-pulse space-y-4"
            >
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="h-6 w-36 bg-stone-200 rounded-lg" />
                <div className="h-6 w-24 bg-stone-200 rounded-full" />
                <div className="h-6 w-28 bg-stone-200 rounded-lg" />
                <div className="h-6 w-8 bg-stone-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? null : orders.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-100 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-800">هنوز سفارشی ثبت نکرده‌اید</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            محصولات تازه پروتئینی را بررسی کرده و با ثبت اولین سفارش، سابقه خرید خود را در این بخش مشاهده کنید.
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>مشاهده محصولات و شروع خرید</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Accordion Order List */
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = !!expandedOrders[order.id];
            const badge = getStatusBadge(order.status, order.statusLabelFa);
            const dateStr = order.createdAtJalali || order.createdAt || '';

            return (
              <div
                key={order.id}
                data-testid={`order-card-${order.id}`}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden transition"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  data-testid={`order-header-${order.id}`}
                  onClick={() => toggleOrderAccordion(order.id)}
                  className="w-full p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-right hover:bg-stone-50/70 transition cursor-pointer select-none"
                  aria-expanded={isExpanded}
                >
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                    {/* Order Number */}
                    <div>
                      <span className="text-xs text-stone-400 block mb-0.5">شماره سفارش</span>
                      <span className="font-bold text-stone-800 text-sm sm:text-base dir-ltr">
                        {order.orderNumber}
                      </span>
                    </div>

                    {/* Date */}
                    {dateStr && (
                      <div className="border-r border-stone-200 pr-3 sm:pr-6">
                        <span className="text-xs text-stone-400 block mb-0.5">تاریخ ثبت</span>
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-600">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{dateStr}</span>
                        </div>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="border-r border-stone-200 pr-3 sm:pr-6">
                      <span className="text-xs text-stone-400 block mb-0.5">وضعیت</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 mr-auto">
                    {/* Total Price */}
                    <div className="text-left">
                      <span className="text-xs text-stone-400 block mb-0.5">مبلغ کل</span>
                      <span className="font-extrabold text-stone-900 text-sm sm:text-base">
                        {formatToman(order.totalAmountToman)} <span className="text-xs font-normal text-stone-500">تومان</span>
                      </span>
                    </div>

                    {/* Expand/Collapse Chevron */}
                    <div
                      className={`w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 bg-stone-200 text-stone-800' : ''
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {/* Collapsible Accordion Body */}
                {isExpanded && (
                  <div
                    data-testid={`order-details-${order.id}`}
                    className="border-t border-stone-100 p-4 sm:p-6 bg-stone-50/40 space-y-6"
                  >
                    {/* Line Items List */}
                    <div>
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                        اقلام سفارش ({toPersianDigits(order.items?.length || 0)} قلم)
                      </h4>
                      <div className="divide-y divide-stone-100 bg-white rounded-xl border border-stone-200 overflow-hidden">
                        {(order.items || []).map((item, idx) => {
                          const itemTotal =
                            item.totalPriceToman ??
                            (item.unitPriceToman ? item.unitPriceToman * item.quantity : 0);

                          return (
                            <div
                              key={`${item.variantId}-${idx}`}
                              className="p-3 sm:p-4 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.imageUrl || '/images/products/placeholder-meat.svg'}
                                  alt={item.productTitle}
                                  className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl border border-stone-100 bg-stone-50 shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      '/images/products/placeholder-meat.svg';
                                  }}
                                />
                                <div>
                                  <h5 className="font-bold text-stone-800 text-xs sm:text-sm">
                                    {item.productTitle}
                                  </h5>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                                    {item.portionLabel && (
                                      <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-600 font-medium">
                                        {item.portionLabel}
                                      </span>
                                    )}
                                    <span>
                                      {toPersianDigits(item.quantity)} ×{' '}
                                      {formatToman(item.unitPriceToman ?? 0)} تومان
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-left shrink-0">
                                <span className="font-bold text-stone-800 text-xs sm:text-sm">
                                  {formatToman(itemTotal)}
                                </span>{' '}
                                <span className="text-[11px] text-stone-500">تومان</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Delivery & Cost Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Delivery Info */}
                      <div className="bg-white p-4 rounded-xl border border-stone-200 text-xs sm:text-sm space-y-2.5">
                        <div className="flex items-center gap-2 text-stone-700 font-bold border-b border-stone-100 pb-2">
                          <Truck className="w-4 h-4 text-emerald-600" />
                          <span>اطلاعات تحویل و گیرنده</span>
                        </div>
                        {order.recipientName && (
                          <div className="flex items-center gap-2 text-stone-600">
                            <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>تحویل‌گیرنده: {order.recipientName}</span>
                          </div>
                        )}
                        {order.recipientMobile && (
                          <div className="flex items-center gap-2 text-stone-600">
                            <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>موبایل: {toPersianDigits(order.recipientMobile)}</span>
                          </div>
                        )}
                        {order.deliveryAddress && (
                          <div className="flex items-start gap-2 text-stone-600">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{order.deliveryAddress}</span>
                          </div>
                        )}
                        {order.courierNotes && (
                          <div className="text-stone-500 bg-stone-50 p-2.5 rounded-lg text-xs">
                            <span className="font-semibold text-stone-600">یادداشت برای پیک: </span>
                            {order.courierNotes}
                          </div>
                        )}
                      </div>

                      {/* Financial Summary */}
                      <div className="bg-white p-4 rounded-xl border border-stone-200 text-xs sm:text-sm space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-stone-700 font-bold border-b border-stone-100 pb-2">
                            <CreditCard className="w-4 h-4 text-emerald-600" />
                            <span>جزئیات پرداخت</span>
                          </div>
                          <div className="flex justify-between items-center text-stone-600">
                            <span>هزینه ارسال:</span>
                            <span className="font-semibold text-stone-800">
                              {order.shippingFeeToman && order.shippingFeeToman > 0
                                ? `${formatToman(order.shippingFeeToman)} تومان`
                                : 'رایگان'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-stone-900 font-bold text-sm pt-2 border-t border-stone-100">
                            <span>مبلغ کل پرداختی:</span>
                            <span className="text-emerald-700 font-extrabold text-base">
                              {formatToman(order.totalAmountToman)} تومان
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
                          {/* 1-Click Re-order */}
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            disabled={reorderingId === order.id}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            {reorderingId === order.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                            <span>سفارش مجدد</span>
                          </button>

                          {/* Live Tracking */}
                          {order.trackingCode && (
                            <Link
                              href={`/track/${order.trackingCode}`}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-stone-200 hover:bg-stone-100 text-stone-700 rounded-xl text-xs sm:text-sm font-semibold transition"
                            >
                              <ExternalLink className="w-4 h-4 text-stone-500" />
                              <span>رهگیری سفارش</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
