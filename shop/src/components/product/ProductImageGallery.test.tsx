import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductImageGallery } from './ProductImageGallery';

describe('ProductImageGallery', () => {
  const mockImages = [
    '/images/products/turkey-ham-1.png',
    '/images/products/turkey-ham-2.png',
  ];

  it('renders gallery with container constraints and optimized image attributes', () => {
    render(
      <ProductImageGallery
        images={mockImages}
        title="ژامبون بوقلمون ۹۰٪"
        discountPercent={15}
        isBestseller={true}
        freshDeliGuarantee={true}
      />
    );

    const container = screen.getByTestId('gallery-container');
    expect(container).toHaveClass('max-w-[380px]');

    const mainImage = screen.getByTestId('main-product-image');
    expect(mainImage).toHaveAttribute('src', mockImages[0]);
    expect(mainImage).toHaveAttribute('loading', 'eager');
    expect(mainImage).toHaveAttribute('fetchpriority', 'high');
    expect(mainImage).toHaveClass('object-contain');

    // Badges present
    expect(screen.getByText(/۱۵٪ تخفیف/)).toBeInTheDocument();
    expect(screen.getByText(/پرفروش/)).toBeInTheDocument();
    expect(screen.getByText(/ضمانت تازگی دلی/)).toBeInTheDocument();
  });

  it('switches main image when thumbnail is clicked', () => {
    render(
      <ProductImageGallery
        images={mockImages}
        title="ژامبون بوقلمون ۹۰٪"
      />
    );

    const mainImage = screen.getByTestId('main-product-image');
    expect(mainImage).toHaveAttribute('src', mockImages[0]);

    const thumb2 = screen.getByRole('button', { name: /تصویر بندانگشتی ۲/i });
    fireEvent.click(thumb2);

    expect(screen.getByTestId('main-product-image')).toHaveAttribute('src', mockImages[1]);
  });
});
