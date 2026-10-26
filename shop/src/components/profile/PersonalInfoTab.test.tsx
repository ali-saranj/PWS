import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PersonalInfoTab from './PersonalInfoTab';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api';

describe('PersonalInfoTab', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      customer: {
        id: 42,
        mobile: '09129876543',
        firstName: 'رضا',
        lastName: 'حسینی',
        email: 'reza@example.com',
      },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('renders customer info with read-only mobile and verified badge', () => {
    render(<PersonalInfoTab />);

    // Mobile input is read-only / disabled
    const mobileInput = screen.getByLabelText(/شماره موبایل/i);
    expect(mobileInput).toBeDisabled();
    expect(mobileInput).toHaveValue('۰۹۱۲۹۸۷۶۵۴۳');

    // Verified badge
    expect(screen.getByText('تأیید شده')).toBeInTheDocument();

    // First and last name inputs pre-filled
    expect(screen.getByLabelText(/^نام$/i)).toHaveValue('رضا');
    expect(screen.getByLabelText(/نام خانوادگی/i)).toHaveValue('حسینی');
    expect(screen.getByLabelText(/ایمیل/i)).toHaveValue('reza@example.com');
  });

  it('updates customer profile and displays success feedback', async () => {
    const user = userEvent.setup();
    const putSpy = vi.spyOn(api, 'put').mockResolvedValue({
      id: 42,
      mobile: '09129876543',
      firstName: 'محمد',
      lastName: 'احمدی',
      email: 'm.ahmadi@example.com',
    });

    render(<PersonalInfoTab />);

    const firstNameInput = screen.getByLabelText(/^نام$/i);
    const lastNameInput = screen.getByLabelText(/نام خانوادگی/i);
    const emailInput = screen.getByLabelText(/ایمیل/i);

    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'محمد');

    await user.clear(lastNameInput);
    await user.type(lastNameInput, 'احمدی');

    await user.clear(emailInput);
    await user.type(emailInput, 'm.ahmadi@example.com');

    const submitButton = screen.getByRole('button', { name: /ذخیره تغییرات/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(putSpy).toHaveBeenCalledWith('/api/shop/customer/profile', {
        firstName: 'محمد',
        lastName: 'احمدی',
        email: 'm.ahmadi@example.com',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/اطلاعات با موفقیت ذخیره شد/i)).toBeInTheDocument();
    });

    // Check authStore updated
    const state = useAuthStore.getState();
    expect(state.customer?.firstName).toBe('محمد');
    expect(state.customer?.lastName).toBe('احمدی');
    expect(state.customer?.email).toBe('m.ahmadi@example.com');
  });

  it('validates email format before submitting', async () => {
    const user = userEvent.setup();
    const putSpy = vi.spyOn(api, 'put');

    render(<PersonalInfoTab />);

    const emailInput = screen.getByLabelText(/ایمیل/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /ذخیره تغییرات/i });
    await user.click(submitButton);

    expect(screen.getByText(/فرمت ایمیل نامعتبر است/i)).toBeInTheDocument();
    expect(putSpy).not.toHaveBeenCalled();
  });

  it('handles API error during profile update', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'put').mockRejectedValue({
      data: { message: 'خطای سرور در ذخیره اطلاعات' },
    });

    render(<PersonalInfoTab />);

    const submitButton = screen.getByRole('button', { name: /ذخیره تغییرات/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/خطای سرور در ذخیره اطلاعات/i)).toBeInTheDocument();
    });
  });
});
