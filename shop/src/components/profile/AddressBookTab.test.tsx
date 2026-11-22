import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddressBookTab, { Address } from './AddressBookTab';
import { api } from '@/lib/api';

const mockAddresses: Address[] = [
  {
    id: 1,
    customerId: 10,
    province: 'تهران',
    city: 'تهران',
    line: 'خیابان ولیعصر، کوچه نصر، پلاک ۴',
    postalCode: '1234567890',
    recipientName: 'رضا حسینی',
    recipientMobile: '09121111111',
    isDefault: true,
  },
  {
    id: 2,
    customerId: 10,
    province: 'تهران',
    city: 'تهران',
    line: 'خیابان شریعتی، نبش ظفر، پلاک ۱۲',
    postalCode: '9876543210',
    recipientName: 'سارا حسینی',
    recipientMobile: '09122222222',
    isDefault: false,
  },
];

describe('AddressBookTab', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state then lists addresses with default badge', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([...mockAddresses]);

    render(<AddressBookTab />);

    expect(screen.getByTestId('address-loading-skeleton')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('رضا حسینی')).toBeInTheDocument();
    });

    expect(screen.getByText('سارا حسینی')).toBeInTheDocument();
    expect(screen.getByText(/خیابان ولیعصر/)).toBeInTheDocument();
    expect(screen.getByText(/خیابان شریعتی/)).toBeInTheDocument();

    // Default badge check
    const defaultBadges = screen.getAllByText('پیش‌فرض');
    expect(defaultBadges.length).toBeGreaterThanOrEqual(1);

    // "انتخاب به عنوان پیش‌فرض" action for non-default address
    expect(screen.getByText('انتخاب به عنوان پیش‌فرض')).toBeInTheDocument();
  });

  it('renders empty state when customer has no saved addresses', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([]);

    render(<AddressBookTab />);

    await waitFor(() => {
      expect(screen.getByText(/هنوز آدرسی ثبت نکرده‌اید/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /افزودن اولین آدرس/i })).toBeInTheDocument();
  });

  it('opens add address modal and creates a new address', async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce([...mockAddresses]);
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
      id: 3,
      customerId: 10,
      province: 'اصفهان',
      city: 'اصفهان',
      line: 'میدان ونک، برج نگار، طبقه ۵',
      postalCode: '1122334455',
      recipientName: 'امیر رضایی',
      recipientMobile: '09123333333',
      isDefault: false,
    });

    render(<AddressBookTab />);

    await waitFor(() => {
      expect(screen.getByText('رضا حسینی')).toBeInTheDocument();
    });

    // Click "افزودن آدرس جدید" button
    const addButton = screen.getByRole('button', { name: /افزودن آدرس جدید/i });
    await user.click(addButton);

    // Modal opens
    expect(screen.getByRole('heading', { name: /افزودن آدرس جدید/i })).toBeInTheDocument();

    // Fill form
    await user.type(screen.getByLabelText(/نام و نام خانوادگی تحویل‌گیرنده/i), 'امیر رضایی');
    await user.type(screen.getByLabelText(/شماره موبایل/i), '۰۹۱۲۳۳۳۳۳۳۳');
    await user.type(screen.getByLabelText(/نشانی پستی دقیق/i), 'میدان ونک، برج نگار، طبقه ۵');
    await user.type(screen.getByLabelText(/کد پستی/i), '۱۱۲۲۳۳۴۴۵۵');

    // Mock next GET to include new address
    getSpy.mockResolvedValueOnce([
      ...mockAddresses,
      {
        id: 3,
        customerId: 10,
        province: 'اصفهان',
        city: 'اصفهان',
        line: 'میدان ونک، برج نگار، طبقه ۵',
        postalCode: '1122334455',
        recipientName: 'امیر رضایی',
        recipientMobile: '09123333333',
        isDefault: false,
      },
    ]);

    // Submit
    const submitButton = screen.getByRole('button', { name: /ثبت آدرس/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        '/api/shop/customer/addresses',
        expect.objectContaining({
          recipientName: 'امیر رضایی',
          recipientMobile: '09123333333',
          line: 'میدان ونک، برج نگار، طبقه ۵',
          postalCode: '1122334455',
          province: 'اصفهان',
          city: 'اصفهان',
        })
      );
    });

    // Modal closes and new address is displayed
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /افزودن آدرس جدید/i })).not.toBeInTheDocument();
      expect(screen.getByText('امیر رضایی')).toBeInTheDocument();
    });
  });

  it('validates 10-digit postal code and mobile in add/edit modal', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'get').mockResolvedValue([...mockAddresses]);

    render(<AddressBookTab />);

    await waitFor(() => {
      expect(screen.getByText('رضا حسینی')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /افزودن آدرس جدید/i }));

    // Empty submission triggers validation
    await user.click(screen.getByRole('button', { name: /ثبت آدرس/i }));
    expect(screen.getByText(/نام تحویل‌گیرنده را وارد کنید/i)).toBeInTheDocument();

    // Type name, invalid mobile
    await user.type(screen.getByLabelText(/نام و نام خانوادگی تحویل‌گیرنده/i), 'تست');
    await user.type(screen.getByLabelText(/شماره موبایل/i), '1234');
    await user.click(screen.getByRole('button', { name: /ثبت آدرس/i }));
    expect(screen.getByText(/شماره موبایل تحویل‌گیرنده نامعتبر است/i)).toBeInTheDocument();

    // Fix mobile, missing line
    await user.clear(screen.getByLabelText(/شماره موبایل/i));
    await user.type(screen.getByLabelText(/شماره موبایل/i), '09121234567');
    await user.click(screen.getByRole('button', { name: /ثبت آدرس/i }));
    expect(screen.getByText(/نشانی پستی را وارد کنید/i)).toBeInTheDocument();

    // Add line, invalid postal code (e.g. 5 digits)
    await user.type(screen.getByLabelText(/نشانی پستی دقیق/i), 'خیابان بهار');
    await user.type(screen.getByLabelText(/کد پستی/i), '12345');
    await user.click(screen.getByRole('button', { name: /ثبت آدرس/i }));
    expect(screen.getByText(/کد پستی باید ۱۰ رقم باشد/i)).toBeInTheDocument();
  });

  it('opens edit modal and updates an address', async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce([...mockAddresses]);
    const putSpy = vi.spyOn(api, 'put').mockResolvedValue({
      ...mockAddresses[1],
      line: 'خیابان شریعتی، بالاتر از میرداماد، پلاک ۲۰',
    });

    render(<AddressBookTab />);

    await waitFor(() => {
      expect(screen.getByText('سارا حسینی')).toBeInTheDocument();
    });

    // Click edit on the second address
    const editButtons = screen.getAllByRole('button', { name: /ویرایش/i });
    await user.click(editButtons[1]);

    // Modal opens with pre-filled values
    expect(screen.getByRole('heading', { name: /ویرایش آدرس/i })).toBeInTheDocument();
    const lineInput = screen.getByLabelText(/نشانی پستی دقیق/i);
    expect(lineInput).toHaveValue(mockAddresses[1].line);

    await user.clear(lineInput);
    await user.type(lineInput, 'خیابان شریعتی، بالاتر از میرداماد، پلاک ۲۰');

    getSpy.mockResolvedValueOnce([
      mockAddresses[0],
      {
        ...mockAddresses[1],
        line: 'خیابان شریعتی، بالاتر از میرداماد، پلاک ۲۰',
      },
    ]);

    await user.click(screen.getByRole('button', { name: /ذخیره تغییرات/i }));

    await waitFor(() => {
      expect(putSpy).toHaveBeenCalledWith(
        '/api/shop/customer/addresses/2',
        expect.objectContaining({
          line: 'خیابان شریعتی، بالاتر از میرداماد، پلاک ۲۰',
          recipientName: 'سارا حسینی',
        })
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /ویرایش آدرس/i })).not.toBeInTheDocument();
      expect(screen.getByText(/بالاتر از میرداماد/)).toBeInTheDocument();
    });
  });

  it('sets address as default when clicking "انتخاب به عنوان پیش‌فرض"', async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce([...mockAddresses]);
    const putSpy = vi.spyOn(api, 'put').mockResolvedValue({
      ...mockAddresses[1],
      isDefault: true,
    });

    render(<AddressBookTab />);

    await waitFor(() => {
      expect(screen.getByText('سارا حسینی')).toBeInTheDocument();
    });

    const setDefaultButton = screen.getByRole('button', { name: /انتخاب به عنوان پیش‌فرض/i });

    getSpy.mockResolvedValueOnce([
      { ...mockAddresses[0], isDefault: false },
      { ...mockAddresses[1], isDefault: true },
    ]);

    await user.click(setDefaultButton);

    await waitFor(() => {
      expect(putSpy).toHaveBeenCalledWith('/api/shop/customer/addresses/2/default');
    });

    await waitFor(() => {
      // Now both addresses reloaded with id 2 as default
      const cards = screen.getAllByTestId('address-card');
      expect(cards[1]).toHaveTextContent('پیش‌فرض');
    });
  });

  it('deletes an address with confirmation', async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce([...mockAddresses]);
    const deleteSpy = vi.spyOn(api, 'delete').mockResolvedValue({});

    render(<AddressBookTab />);

    await waitFor(() => {
      expect(screen.getByText('سارا حسینی')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /حذف/i });
    // Click delete on address 2
    await user.click(deleteButtons[1]);

    // Confirmation prompt appears
    expect(screen.getByText(/آیا از حذف این آدرس اطمینان دارید؟/i)).toBeInTheDocument();

    getSpy.mockResolvedValueOnce([mockAddresses[0]]);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /بله، حذف شود/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('/api/shop/customer/addresses/2');
    });

    await waitFor(() => {
      expect(screen.queryByText('سارا حسینی')).not.toBeInTheDocument();
    });
  });
});
