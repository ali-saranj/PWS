import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ProductCard } from './ProductCard';
import { useCartStore } from '@/lib/cartStore';

describe('ProductCard Component', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  const sampleProduct = {
    id: 10,
    slug: 'smoked-turkey-ham',
    nameFa: 'ژامبون بوقلمون دودی',
    brandNameFa: 'آندره',
    priceToman: 240000,
    compareAtPriceToman: 300000,
    discountPercent: 20,
    inStock: true,
    totalStock: 50,
    badges: ['ویژه'],
    defaultVariantId: 101,
  };

  it('renders product information with Persian price and discount', () => {
    render(<ProductCard product={sampleProduct as any} />);

    expect(screen.getByText('ژامبون بوقلمون دودی')).toBeDefined();
    expect(screen.getByText('آندره')).toBeDefined();
    expect(screen.getByText(/۲۴۰/)).toBeDefined();
    expect(screen.getByText('٪')).toBeDefined();
    expect(screen.getByText('۲۰')).toBeDefined();
  });

  it('shows out of stock badge when inStock is false', () => {
    render(<ProductCard product={{ ...sampleProduct, inStock: false } as any} />);

    expect(screen.getAllByText('ناموجود').length).toBeGreaterThan(0);
  });

  it('adds product with defaultVariantId to cart when clicking quick add', () => {
    render(<ProductCard product={sampleProduct as any} />);

    const addButton = screen.getByRole('button', { name: /افزودن به سبد/i });
    fireEvent.click(addButton);

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(10);
    expect(items[0].variantId).toBe(101);
    expect(items[0].priceToman).toBe(240000);
  });
});
