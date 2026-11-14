'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import { formatToman, toPersianDigits } from '@/lib/format';

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const {
    isOpen,
    closeCart,
    items,
    updateQuantity,
    removeItem,
    getTotalToman,
    getTotalItems,
  } = useCartStore();

  const totalItems = getTotalItems();
  const totalToman = getTotalToman();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-vazirmatn text-right">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full animate-slide-in-right">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-gray-900">سبد خرید شما</h2>
              <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                {toPersianDigits(totalItems)} کالا
              </span>
            </div>
            <button
              onClick={closeCart}
              aria-label="بستن سبد خرید"
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4 border border-gray-100">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  سبد خرید شما خالی است
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mb-6 leading-relaxed">
                  می‌توانید انواع محصولات پروتئینی، سوسیس و کالباس و اقلام سوپرمارکتی را انتخاب و اضافه کنید.
                </p>
                <Link
                  href="/products"
                  onClick={closeCart}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl shadow-md shadow-primary/20 transition-all inline-flex items-center gap-2"
                >
                  <span>مشاهده محصولات</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 relative group transition-all hover:bg-gray-50/80"
                  >
                    {/* Item Thumbnail */}
                    <div className="w-18 h-18 rounded-xl bg-white border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-gray-300" />
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 truncate">
                          {item.name}
                        </h4>
                        {item.variantName && (
                          <span className="text-xs text-gray-500 font-medium block mt-0.5">
                            {item.variantName}
                          </span>
                        )}
                        <div className="text-xs font-semibold text-primary mt-1">
                          {formatToman(item.priceToman)} تومان
                        </div>
                      </div>

                      {/* Stepper & Total */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/60">
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.min(item.quantity + 1, item.maxStock ?? 999)
                              )
                            }
                            aria-label="افزایش تعداد"
                            className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <span className="text-xs font-bold w-5 text-center text-gray-800">
                            {toPersianDigits(item.quantity)}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeItem(item.id);
                              } else {
                                updateQuantity(item.id, item.quantity - 1);
                              }
                            }}
                            aria-label={
                              item.quantity <= 1 ? 'حذف محصول' : 'کاهش تعداد'
                            }
                            className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            {item.quantity <= 1 ? (
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="text-xs font-bold text-gray-800">
                          {formatToman(item.priceToman * item.quantity)} تومان
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Summary & Action */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 p-5 bg-white space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">مجموع اقلام:</span>
                <span className="font-bold text-gray-900 text-base">
                  {formatToman(totalToman)} تومان
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <Truck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>تحویل با پیک شهری، هزینه ارسال در مرحله بعد محاسبه می‌شود.</span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-primary/25 flex items-center justify-center gap-2 group"
              >
                <span>تکمیل خرید و تسویه‌حساب</span>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
