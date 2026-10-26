import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrdersTab, { CustomerOrder } from './OrdersTab';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/cartStore';

const mockOrders: CustomerOrder[] = [
  {
    id: 12,
    orderNumber: 'PWS-050805-0001',
    trackingCode: 'TRK-8K2N9F1X',
    status: 'DISPATCHED',
    statusLabelFa: 'ارسال با پیک',
    totalAmountRials: 7200000,
    totalAmountToman: 720000,
    shippingFeeRials: 500000,
    shippingFeeToman: 50000,
    deliveryAddress: 'تهران، خیابان شریعتی، کوچه بهار، پلاک ۴',
    recipientName: 'علی رضایی',
    recipientMobile: '09121234567',
    courierNotes: 'تحویل به لابی برج',
    createdAt: '2026-10-26T14:30:00Z',
    createdAtJalali: '۱۴۰۵/۰۸/۰۴ - ۱۴:۳۰',
    items: [
      {
        variantId: 101,
        productId: 5,
        productTitle: 'ژامبون بوقلمون ۹۰٪ آندره',
        portionLabel: '۲۵۰ گرم اسلایس',
        sku: 'AND-TURK-250G',
        quantity: 2,
        unitPriceRials: 1850000,
        unitPriceToman: 185000,
        totalPriceToman: 370000,
        imageUrl: '/images/products/placeholder-meat.svg',
      },
      {
        variantId: 102,
        productId: 6,
        productTitle: 'سوسیس فرانکفورتر',
        portionLabel: '۵۰۰ گرم',
        sku: 'FRK-500G',
        quantity: 1,
        unitPriceRials: 3000000,
        unitPriceToman: 300000,
        totalPriceToman: 300000,
        imageUrl: '/images/products/sausage-202.png',
      },
    ],
  },
  {
    id: 13,
    orderNumber: 'PWS-050805-0002',
    trackingCode: 'TRK-9M3L8Q2Y',
    status: 'DELIVERED',
    statusLabelFa: 'تحویل داده شده',
    totalAmountRials: 4500000,
    totalAmountToman: 450000,
    shippingFeeRials: 0,
    shippingFeeToman: 0,
    deliveryAddress: 'تهران، سعادت‌آباد، خیابان سرو، پلاک ۱۰',
    recipientName: 'مریم کمالی',
    recipientMobile: '09129876543',
    createdAt: '2026-10-25T10:15:00Z',
    createdAtJalali: '۱۴۰۵/۰۸/۰۳ - ۱۰:۱۵',
    items: [
      {
        variantId: 103,
        productId: 7,
        productTitle: 'بیکن گوشت دودی',
        portionLabel: '۳۰۰ گرم',
        quantity: 1,
        unitPriceToman: 450000,
        totalPriceToman: 450000,
      },
    ],
  },
];

describe('OrdersTab', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useCartStore.setState({ items: [], isOpen: false });
  });

  it('renders loading skeleton and then renders order list headers', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([...mockOrders]);

    render(<OrdersTab />);

    expect(screen.getByTestId('orders-loading-skeleton')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('PWS-050805-0001')).toBeInTheDocument();
    });

    expect(screen.getByText('PWS-050805-0002')).toBeInTheDocument();
    expect(screen.getByText('۱۴۰۵/۰۸/۰۴ - ۱۴:۳۰')).toBeInTheDocument();
    expect(screen.getByText('ارسال با پیک')).toBeInTheDocument();
    expect(screen.getByText('تحویل داده شده')).toBeInTheDocument();
    expect(screen.getByText(/۷۲۰,۰۰۰/)).toBeInTheDocument();
  });

  it('renders empty state when orders list is empty', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([]);

    render(<OrdersTab />);

    await waitFor(() => {
      expect(screen.getByText('هنوز سفارشی ثبت نکرده‌اید')).toBeInTheDocument();
    });

    const startShoppingLink = screen.getByRole('link', {
      name: /مشاهده محصولات و شروع خرید/i,
    });
    expect(startShoppingLink).toBeInTheDocument();
    expect(startShoppingLink).toHaveAttribute('href', '/products');
  });

  it('shows error state with retry button when order fetch fails', async () => {
    vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Network error'));

    render(<OrdersTab />);

    await waitFor(() => {
      expect(screen.getByText(/خطا در دریافت لیست سفارش‌ها/)).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /تلاش مجدد/i });
    expect(retryBtn).toBeInTheDocument();

    vi.spyOn(api, 'get').mockResolvedValueOnce([...mockOrders]);
    await userEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('PWS-050805-0001')).toBeInTheDocument();
    });
  });

  it('clicking order header expands and collapses line items and delivery info', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([...mockOrders]);

    render(<OrdersTab />);

    await waitFor(() => {
      expect(screen.getByText('PWS-050805-0001')).toBeInTheDocument();
    });

    // Details are initially collapsed
    expect(screen.queryByText('ژامبون بوقلمون ۹۰٪ آندره')).not.toBeInTheDocument();
    expect(screen.queryByText(/تحویل به لابی برج/)).not.toBeInTheDocument();

    // Click header to expand
    const firstOrderHeader = screen.getByTestId('order-header-12');
    await userEvent.click(firstOrderHeader);

    // Expanded details visible
    const details = screen.getByTestId('order-details-12');
    expect(within(details).getByText('ژامبون بوقلمون ۹۰٪ آندره')).toBeInTheDocument();
    expect(within(details).getByText('۲۵۰ گرم اسلایس')).toBeInTheDocument();
    expect(within(details).getByText('سوسیس فرانکفورتر')).toBeInTheDocument();
    expect(within(details).getByText(/تهران، خیابان شریعتی، کوچه بهار، پلاک ۴/)).toBeInTheDocument();
    expect(within(details).getByText(/علی رضایی/)).toBeInTheDocument();
    expect(within(details).getByText(/تحویل به لابی برج/)).toBeInTheDocument();
    expect(within(details).getByText(/۵۰,۰۰۰/)).toBeInTheDocument(); // Shipping fee

    // Tracking link
    const trackLink = within(details).getByRole('link', { name: /رهگیری سفارش/i });
    expect(trackLink).toHaveAttribute('href', '/track/TRK-8K2N9F1X');

    // Click again to collapse
    await userEvent.click(firstOrderHeader);
    expect(screen.queryByText('ژامبون بوقلمون ۹۰٪ آندره')).not.toBeInTheDocument();
  });

  it('clicking "سفارش مجدد" calls reorder endpoint, adds items to cart store, and opens cart drawer', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([mockOrders[0]]);

    const reorderResponse = {
      addedItems: [
        {
          productId: 5,
          variantId: 101,
          title: 'ژامبون بوقلمون ۹۰٪ آندره',
          portionLabel: '۲۵۰ گرم اسلایس',
          priceToman: 195000,
          quantity: 2,
          maxStock: 10,
          imageUrl: '/images/products/placeholder-meat.svg',
        },
        {
          productId: 6,
          variantId: 102,
          title: 'سوسیس فرانکفورتر',
          portionLabel: '۵۰۰ گرم',
          priceToman: 310000,
          quantity: 1,
          maxStock: 5,
          imageUrl: '/images/products/sausage-202.png',
        },
      ],
      unavailableItems: [],
    };

    const postSpy = vi.spyOn(api, 'post').mockResolvedValue(reorderResponse);

    render(<OrdersTab />);

    await waitFor(() => {
      expect(screen.getByText('PWS-050805-0001')).toBeInTheDocument();
    });

    // Expand order
    await userEvent.click(screen.getByTestId('order-header-12'));

    // Click Reorder
    const reorderBtn = screen.getByRole('button', { name: /سفارش مجدد/i });
    await userEvent.click(reorderBtn);

    expect(postSpy).toHaveBeenCalledWith('/api/shop/customer/orders/12/reorder');

    // Verify cartStore state
    const cartState = useCartStore.getState();
    expect(cartState.items).toHaveLength(2);
    expect(cartState.items[0]).toMatchObject({
      id: '5-101',
      productId: 5,
      variantId: 101,
      name: 'ژامبون بوقلمون ۹۰٪ آندره',
      variantName: '۲۵۰ گرم اسلایس',
      priceToman: 195000,
      quantity: 2,
    });
    expect(cartState.items[1]).toMatchObject({
      id: '6-102',
      productId: 6,
      variantId: 102,
      name: 'سوسیس فرانکفورتر',
      variantName: '۵۰۰ گرم',
      priceToman: 310000,
      quantity: 1,
    });
    expect(cartState.isOpen).toBe(true);

    // Verify feedback notification
    await waitFor(() => {
      expect(screen.getByText(/قلم کالا به سبد خرید اضافه شد/)).toBeInTheDocument();
    });
  });

  it('handles unavailable items feedback when reordering partially out-of-stock orders', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([mockOrders[0]]);

    const reorderResponse = {
      addedItems: [
        {
          productId: 5,
          variantId: 101,
          title: 'ژامبون بوقلمون ۹۰٪ آندره',
          portionLabel: '۲۵۰ گرم اسلایس',
          priceToman: 195000,
          quantity: 2,
          maxStock: 10,
        },
      ],
      unavailableItems: ['سوسیس فرانکفورتر'],
    };

    vi.spyOn(api, 'post').mockResolvedValue(reorderResponse);

    render(<OrdersTab />);

    await waitFor(() => {
      expect(screen.getByText('PWS-050805-0001')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('order-header-12'));
    await userEvent.click(screen.getByRole('button', { name: /سفارش مجدد/i }));

    // Cart store updated with 1 item
    const cartState = useCartStore.getState();
    expect(cartState.items).toHaveLength(1);
    expect(cartState.isOpen).toBe(true);

    // Feedback shows unavailable item note
    await waitFor(() => {
      expect(screen.getByText(/اقلام ناموجود: سوسیس فرانکفورتر/)).toBeInTheDocument();
    });
  });
});
