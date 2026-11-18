import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer component', () => {
  it('renders trust badges', () => {
    render(<Footer />);
    expect(screen.getByText(/ضمانت اصالت و تازگی کالا/)).toBeInTheDocument();
    expect(screen.getByText(/ارسال سریع/)).toBeInTheDocument();
    expect(screen.getByText(/پرداخت امن/)).toBeInTheDocument();
  });

  it('renders customer service contact info', () => {
    render(<Footer />);
    expect(screen.getByText(/۰۲۱-۸۸۸۸۹۹۹۹/)).toBeInTheDocument();
    expect(screen.getByText(/support@proteinirany.ir/)).toBeInTheDocument();
  });

  it('renders newsletter subscription form', () => {
    render(<Footer />);
    expect(screen.getByPlaceholderText(/شماره موبایل یا ایمیل/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /عضویت/ })).toBeInTheDocument();
  });

  it('renders copyright text', () => {
    render(<Footer />);
    expect(
      screen.getByText(/کلیه حقوق این وب‌سایت متعلق به سوپرمارکت آنلاین پروتئین ایرانی می‌باشد/)
    ).toBeInTheDocument();
  });

  it('renders enamad trust seal badge for regular browsers', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /نماد اعتماد الکترونیکی/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      'https://trustseal.enamad.ir/?id=8617111&code=XI0dJOGnVVyu4yLlcGotBytDYzEADRgt'
    );
    expect(link).toHaveAttribute('referrerpolicy', 'origin');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).not.toHaveAttribute('rel', expect.stringContaining('noreferrer'));

    const img = screen.getByAltText(/نماد اعتماد الکترونیکی/i);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute(
      'src',
      'https://trustseal.enamad.ir/logo.aspx?id=8617111&code=XI0dJOGnVVyu4yLlcGotBytDYzEADRgt'
    );
  });

  it('keeps local enamad badge for search engine crawlers (Googlebot)', () => {
    const originalUserAgent = navigator.userAgent;
    try {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        configurable: true,
      });

      render(<Footer />);
      const img = screen.getByAltText(/نماد اعتماد الکترونیکی/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/images/enamad.png');
    } finally {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    }
  });
});
