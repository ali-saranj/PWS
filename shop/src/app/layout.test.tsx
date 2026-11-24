import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import RootLayout, { metadata } from './layout';
import { BRAND } from '@/config/branding';

describe('RootLayout Metadata and Structured Data', () => {
  it('has https production domain in BRAND and metadataBase', () => {
    expect(BRAND.domain).toBe('https://proteinirany.ir');
    expect(metadata.metadataBase?.toString()).toBe('https://proteinirany.ir/');
    expect(metadata.alternates?.canonical).toBeUndefined();
  });

  it('contains Persian store titles and openGraph configuration', () => {
    expect(metadata.title).toEqual({
      default: BRAND.titleFa,
      template: `%s | ${BRAND.nameFa}`,
    });
    expect(metadata.openGraph?.url?.toString()).toBe('https://proteinirany.ir');
  });

  it('renders Organization and WebSite JSON-LD structured data with bilingual brand names', () => {
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
    expect(
      jsonParsed.some((j) =>
        Array.isArray(j['@type'])
          ? j['@type'].includes('Organization')
          : j['@type'] === 'Organization'
      )
    ).toBe(true);
    expect(jsonParsed.some((j) => j['@type'] === 'WebSite')).toBe(true);

    const org = jsonParsed.find((j) =>
      Array.isArray(j['@type'])
        ? j['@type'].includes('Organization')
        : j['@type'] === 'Organization'
    );
    expect(org).toBeDefined();
    expect(org['@id']).toBe('https://proteinirany.ir/#organization');
    expect(org.name).toBe('پروتئین ایرانی');
    expect(org.alternateName).toEqual(['ProteinIrany', 'Protein Irany']);
    expect(org.url).toBe('https://proteinirany.ir');
    expect(org.logo).toBe('https://proteinirany.ir/images/logo.png');
    expect(org.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: 'اصفهان، خیابان رهنان، خیابان مطهری، چهارراه طاحونه، دهکده پروتئین',
      addressLocality: 'Isfahan',
      addressRegion: 'اصفهان',
      addressCountry: 'IR',
    });

    // Verify both brand names are present in raw script tag text
    const orgScript = scriptTags.find((s) => s.textContent?.includes('#organization'));
    expect(orgScript).toBeDefined();
    expect(orgScript?.textContent).toContain('پروتئین ایرانی');
    expect(orgScript?.textContent).toContain('ProteinIrany');
  });
});
