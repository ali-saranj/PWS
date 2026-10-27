import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterSidebar, FilterState } from './FilterSidebar';

const defaultValues: FilterState = {
  categoryId: null,
  brandId: null,
  brands: [],
  inStockOnly: false,
  onSaleOnly: false,
  minPrice: null,
  maxPrice: null,
};

describe('FilterSidebar Component', () => {
  it('parses Persian digits in price inputs and calls onChange with numeric values', () => {
    const onChange = vi.fn();
    render(<FilterSidebar values={defaultValues} onChange={onChange} />);

    const minInput = screen.getByPlaceholderText('از مثلا ۲۰,۰۰۰');
    const maxInput = screen.getByPlaceholderText('تا مثلا ۳۰۰,۰۰۰');
    const submitBtn = screen.getByRole('button', { name: /اعمال محدوده قیمت/i });

    // Enter Persian digits ۲۰۰۰۰ and ۳۰۰۰۰
    fireEvent.change(minInput, { target: { value: '۲۰۰۰۰' } });
    fireEvent.change(maxInput, { target: { value: '۳۰۰۰۰' } });
    fireEvent.click(submitBtn);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        minPrice: 20000,
        maxPrice: 30000,
      })
    );
  });

  it('parses Persian and Arabic digits with separators (commas) correctly', () => {
    const onChange = vi.fn();
    render(<FilterSidebar values={defaultValues} onChange={onChange} />);

    const minInput = screen.getByPlaceholderText('از مثلا ۲۰,۰۰۰');
    const maxInput = screen.getByPlaceholderText('تا مثلا ۳۰۰,۰۰۰');
    const submitBtn = screen.getByRole('button', { name: /اعمال محدوده قیمت/i });

    // Enter Persian with comma and Arabic digits with comma: '۲۰,۰۰۰' and '٣٠,٠٠٠'
    fireEvent.change(minInput, { target: { value: '۲۰,۰۰۰' } });
    fireEvent.change(maxInput, { target: { value: '٣٠,٠٠٠' } });
    fireEvent.click(submitBtn);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        minPrice: 20000,
        maxPrice: 30000,
      })
    );
  });

  it('toggles inStockOnly and calls onChange with { inStockOnly: true }', () => {
    const onChange = vi.fn();
    render(<FilterSidebar values={defaultValues} onChange={onChange} />);

    const inStockCheckbox = screen.getByLabelText(/فقط کالاهای موجود/i);
    expect(inStockCheckbox).toBeDefined();

    fireEvent.click(inStockCheckbox);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        inStockOnly: true,
      })
    );
  });

  it('supports brand objects and updates brandId on toggle (select and deselect)', () => {
    const onChange = vi.fn();
    const mockBrands = [
      { id: 42, nameFa: 'کاله', slug: 'kalleh' },
      { id: 99, nameFa: 'سولیکو', slug: 'solico' },
    ];

    const { rerender } = render(
      <FilterSidebar
        values={defaultValues}
        availableBrands={mockBrands}
        onChange={onChange}
      />
    );

    const brandCheckbox = screen.getByLabelText('کاله');
    expect(brandCheckbox).toBeDefined();

    // Select brand
    fireEvent.click(brandCheckbox);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        brandId: 42,
      })
    );

    // Rerender with brand 42 selected, then click again to deselect
    rerender(
      <FilterSidebar
        values={{ ...defaultValues, brandId: 42, brands: ['کاله'] }}
        availableBrands={mockBrands}
        onChange={onChange}
      />
    );

    fireEvent.click(brandCheckbox);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        brandId: null,
      })
    );
  });

  it('supports string array brands and toggles them in brands array', () => {
    const onChange = vi.fn();
    const mockBrands = ['کاله', 'سولیکو'];

    render(
      <FilterSidebar
        values={defaultValues}
        availableBrands={mockBrands}
        onChange={onChange}
      />
    );

    const brandCheckbox = screen.getByLabelText('کاله');
    fireEvent.click(brandCheckbox);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        brands: ['کاله'],
      })
    );
  });

  it('preserves numeric categoryId when selecting category by id', () => {
    const onChange = vi.fn();
    const mockCategories = [
      { id: 10, nameFa: 'سوسیس', slug: 'sausage' },
      { id: 20, nameFa: 'کالباس', slug: 'kham' },
    ];

    render(
      <FilterSidebar
        values={defaultValues}
        categories={mockCategories}
        onChange={onChange}
      />
    );

    const catBtn = screen.getByRole('button', { name: /سوسیس/i });
    fireEvent.click(catBtn);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 10,
      })
    );
  });

  it('resets all filters when clicking reset button', () => {
    const onChange = vi.fn();
    const onReset = vi.fn();

    render(
      <FilterSidebar
        values={{
          ...defaultValues,
          brandId: 42,
          inStockOnly: true,
          minPrice: 10000,
        }}
        onChange={onChange}
        onReset={onReset}
      />
    );

    const resetBtn = screen.getByRole('button', { name: /حذف فیلترها/i });
    fireEvent.click(resetBtn);

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
