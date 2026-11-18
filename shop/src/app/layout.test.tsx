import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import RootLayout, { metadata } from './layout';
import { BRAND } from '@/config/branding';

describe('RootLayout Metadata and Structured Data', () => {
  it('has https production domain in BRAND and metadataBase', () => {
    expect(BRAND.domain).toBe('https://proteinirany.ir');
    expect(metadata.metadataBase?.toString()).toBe('https://proteinirany.ir/');
  });

  it('contains Persian store titles and openGraph configuration', () => {
    expect(metadata.title).toEqual({
      default: BRAND.titleFa,
      template: `%s | ${BRAND.nameFa}`,
    });
    expect(metadata.openGraph?.url?.toString()).toBe('https://proteinirany.ir');
  });

  it('renders Organization and WebSite JSON-LD structured data', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    const scriptTags = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    );
    expect(scriptTags.length).toBeGreaterThanOrEqual(2);

    const jsonParsed = scriptTags.map((s) => JSON.parse(s.textContent || '{}'));
    expect(jsonParsed.some((j) => j['@type'] === 'Organization')).toBe(true);
    expect(jsonParsed.some((j) => j['@type'] === 'WebSite')).toBe(true);
  });
});
