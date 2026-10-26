'use client';

import React, { useState, useEffect } from 'react';
import { X, Phone, KeyRound, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { useAuthStore, Customer } from '@/lib/authStore';
import { toEnglishDigits, toPersianDigits } from '@/lib/format';

interface QuickAuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: (customer: Customer) => void;
  inline?: boolean;
  title?: string;
  description?: string;
}

export const QuickAuthModal: React.FC<QuickAuthModalProps> = ({
  isOpen = true,
  onClose,
  onSuccess,
  inline = false,
  title = 'ورود یا ثبت‌نام',
  description = 'برای تکمیل خرید، شماره تلفن همراه خود را وارد کنید.',
}) => {
  const { sendOtp, verifyOtp } = useAuthStore();

  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(120);
  const [submitting, setSubmitting] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  if (!isOpen && !inline) return null;

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const normalized = toEnglishDigits(raw).replace(/\D/g, '').slice(0, 11);
    setMobile(normalized);
    if (error) setError(null);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const normalized = toEnglishDigits(raw).replace(/\D/g, '').slice(0, 5);
    setCode(normalized);
    if (error) setError(null);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanMobile = toEnglishDigits(mobile).trim();

    if (!/^09\d{9}$/.test(cleanMobile)) {
      setError('لطفاً یک شماره موبایل معتبر ۱۱ رقمی با ۰۹ وارد کنید.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await sendOtp(cleanMobile);
      if (res.success) {
        setStep('otp');
        setCountdown(120);
        setCode('');
      } else {
        setError(res.error || 'خطا در ارسال کد تایید');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = toEnglishDigits(code).trim();

    if (cleanCode.length !== 5) {
      setError('کد تایید باید ۵ رقم باشد.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await verifyOtp(mobile, cleanCode);
      if (res.success && res.customer) {
        onSuccess?.(res.customer);
        if (onClose) onClose();
      } else {
        setError(res.error || 'کد تایید اشتباه است یا منقضی شده.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await sendOtp(mobile);
      if (res.success) {
        setCountdown(120);
        setCode('');
      } else {
        setError(res.error || 'خطا در ارسال مجدد کد');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const strM = m < 10 ? `0${m}` : `${m}`;
    const strS = s < 10 ? `0${s}` : `${s}`;
    return toPersianDigits(`${strM}:${strS}`);
  };

  const content = (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 font-vazirmatn text-right">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        {!inline && onClose && (
          <button
            onClick={onClose}
            aria-label="بستن پنجره"
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {step === 'mobile' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              شماره تلفن همراه
            </label>
            <div className="relative">
              <input
                type="tel"
                value={mobile}
                onChange={handleMobileChange}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                dir="ltr"
                disabled={submitting}
                className="w-full text-center tracking-widest text-base font-semibold py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                autoFocus
              />
              <Phone className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              کد تایید ۵ رقمی به این شماره پیامک خواهد شد.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || mobile.length < 11}
            className="w-full py-3 bg-primary hover:bg-primary-dark disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>ارسال کد تایید</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span>کد تایید به شماره {toPersianDigits(mobile)} ارسال شد</span>
            <button
              type="button"
              onClick={() => {
                setStep('mobile');
                setError(null);
              }}
              className="text-primary hover:underline font-semibold"
            >
              ویرایش شماره
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              کد تایید ۵ رقمی
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="کد ۵ رقمی"
                dir="ltr"
                maxLength={5}
                disabled={submitting}
                className="w-full text-center tracking-widest text-lg font-bold py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                autoFocus
              />
              <KeyRound className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Timer / Resend */}
          <div className="flex items-center justify-between text-xs">
            {countdown > 0 ? (
              <span className="text-gray-500">
                ارسال مجدد کد تا {formatCountdown(countdown)} دیگر
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={submitting}
                className="text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ارسال مجدد کد تایید</span>
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || code.length !== 5}
            className="w-full py-3 bg-primary hover:bg-primary-dark disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>تایید و ادامه</span>
            )}
          </button>
        </form>
      )}
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md">{content}</div>
    </div>
  );
};

export default QuickAuthModal;
