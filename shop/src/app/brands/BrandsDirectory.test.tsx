import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BrandsDirectory from './BrandsDirectory';
import type { BrandItem } from '@/lib/serverCatalog';

const mockBrands: BrandItem[] = [
  {
    id: 1,
    nameFa: 'کاله',
    nameEn: 'Kalleh',
    slug: 'kalleh',
    logoUrl: '/media/brands/kalleh.webp',
  },
  {
    id: 2,
    nameFa: 'آندره',
    nameEn: 'Andre',
    slug: 'andre',
    logoUrl: null,
  },
  {
    id: 3,
    nameFa: '۲۰۲',
    nameEn: '202',
    slug: 'brand-202',
    logoUrl: null,
  },
];

describe('BrandsDirectory Component', () => {
  it('renders all brands with their Persian and English names', () => {
    render(<BrandsDirectory initialBrands={mockBrands} />);

    expect(screen.getByText('کاله')).toBeInTheDocument();
    expect(screen.getByText('Kalleh')).toBeInTheDocument();
    expect(screen.getByText('آندره')).toBeInTheDocument();
    expect(screen.getByText('Andre')).toBeInTheDocument();
    expect(screen.getByText('۲۰۲')).toBeInTheDocument();
    expect(screen.getByText('202')).toBeInTheDocument();
  });

  it('renders links to /products?brandId=[id] for each brand', () => {
    render(<BrandsDirectory initialBrands={mockBrands} />);

    const kallehLink = screen.getByRole('link', { name: /کاله/i });
    expect(kallehLink).toHaveAttribute('href', '/products?brandId=1');

    const andreLink = screen.getByRole('link', { name: /آندره/i });
    expect(andreLink).toHaveAttribute('href', '/products?brandId=2');
  });

  it('renders logo image when logoUrl is present and monogram badge when null', () => {
    render(<BrandsDirectory initialBrands={mockBrands} />);

    const img = screen.getByAltText('کاله');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/media/brands/kalleh.webp');

    // For brand without logo, monogram should render first letter 'آ'
    expect(screen.getByText('آ')).toBeInTheDocument();
  });

  it('filters brands dynamically as user searches in Persian or English', () => {
    render(<BrandsDirectory initialBrands={mockBrands} />);

    const searchInput = screen.getByPlaceholderText(/جستجوی برند/i);

    // Search by Persian name
    fireEvent.change(searchInput, { target: { value: 'کاله' } });
    expect(screen.getByText('کاله')).toBeInTheDocument();
    expect(screen.queryByText('آندره')).not.toBeInTheDocument();
    expect(screen.queryByText('۲۰۲')).not.toBeInTheDocument();

    // Search by English name
    fireEvent.change(searchInput, { target: { value: 'Andre' } });
    expect(screen.getByText('آندره')).toBeInTheDocument();
    expect(screen.queryByText('کاله')).not.toBeInTheDocument();

    // No match
    fireEvent.change(searchInput, { target: { value: 'ناموجود' } });
    expect(screen.getByText(/برندی با این مشخصات یافت نشد/i)).toBeInTheDocument();
  });
});
