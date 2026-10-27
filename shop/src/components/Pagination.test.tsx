import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination Component', () => {
  it('renders nothing when totalPages is 0 or 1', () => {
    const { container } = render(
      <Pagination currentPage={0} totalPages={1} totalElements={10} pageSize={24} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders page buttons with Persian digits', () => {
    render(
      <Pagination
        currentPage={0}
        totalPages={3}
        totalElements={60}
        pageSize={24}
        createPageUrl={(p) => `?page=${p}`}
      />
    );

    expect(screen.getByText('۱')).toBeDefined();
    expect(screen.getByText('۲')).toBeDefined();
    expect(screen.getByText('۳')).toBeDefined();
    expect(screen.getByText(/نمایش ۱ تا ۲۴ از ۶۰/)).toBeDefined();
  });

  it('disables previous button on first page and triggers onPageChange on next', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={0}
        totalPages={4}
        totalElements={80}
        pageSize={24}
        onPageChange={onPageChange}
      />
    );

    const prevButton = screen.getByRole('button', { name: /قبلی/i });
    expect(prevButton).toHaveProperty('disabled', true);

    const nextButton = screen.getByRole('button', { name: /بعدی/i });
    expect(nextButton).toHaveProperty('disabled', false);

    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables next button on last page', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={2}
        totalPages={3}
        totalElements={60}
        pageSize={24}
        onPageChange={onPageChange}
      />
    );

    const nextButton = screen.getByRole('button', { name: /بعدی/i });
    expect(nextButton).toHaveProperty('disabled', true);
  });

  it('renders page links using pageUrlPattern string', () => {
    render(
      <Pagination
        currentPage={0}
        totalPages={2}
        totalElements={40}
        pageSize={24}
        pageUrlPattern="/products?page=__PAGE__"
      />
    );

    const page2Link = screen.getByRole('link', { name: '۲' });
    expect(page2Link).toHaveAttribute('href', '/products?page=1');
  });
});
