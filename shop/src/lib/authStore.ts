import { create } from 'zustand';
import { api, ApiError } from './api';
import { toEnglishDigits } from './format';

export interface Customer {
  id: number;
  mobile: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface AuthState {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => Promise<Customer | null>;
  sendOtp: (mobile: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (
    mobile: string,
    code: string
  ) => Promise<{ success: boolean; customer?: Customer; error?: string }>;
  logout: () => Promise<void>;
  setCustomer: (customer: Customer | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  customer: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setCustomer: (customer) => {
    set({
      customer,
      isAuthenticated: !!customer,
    });
  },

  clearError: () => set({ error: null }),

  checkAuth: async () => {
    if (get().customer && get().isAuthenticated) {
      return get().customer;
    }
    set({ isLoading: true, error: null });
    try {
      const customer = await api.get<Customer>('/api/shop/auth/me');
      if (customer && customer.id) {
        set({ customer, isAuthenticated: true, isLoading: false });
        return customer;
      }
      set({ customer: null, isAuthenticated: false, isLoading: false });
      return null;
    } catch {
      set({ customer: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },

  sendOtp: async (mobile: string) => {
    set({ isLoading: true, error: null });
    const cleanMobile = toEnglishDigits(mobile).trim();
    try {
      await api.post('/api/shop/auth/otp', { mobile: cleanMobile });
      set({ isLoading: false });
      return { success: true };
    } catch (err: any) {
      const msg =
        err?.data?.message || err?.message || 'خطا در ارسال کد تایید. لطفا دوباره تلاش کنید.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  verifyOtp: async (mobile: string, code: string) => {
    set({ isLoading: true, error: null });
    const cleanMobile = toEnglishDigits(mobile).trim();
    const cleanCode = toEnglishDigits(code).trim();
    try {
      const customer = await api.post<Customer>('/api/shop/auth/verify', {
        mobile: cleanMobile,
        code: cleanCode,
      });
      set({
        customer,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return { success: true, customer };
    } catch (err: any) {
      const msg =
        err?.data?.message || err?.message || 'کد تایید وارد شده نامعتبر یا منقضی شده است.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.post('/api/shop/auth/logout');
    } catch {
      // ignore
    } finally {
      set({
        customer: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },
}));
