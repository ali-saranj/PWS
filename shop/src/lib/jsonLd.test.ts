import { describe, it, expect } from 'vitest';
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateProductSchema,
  generateBreadcrumbsSchema,
} from './jsonLd';

describe('JSON-LD Schema Builders', () => {
  it('generates valid Organization schema', () => {
    const org = generateOrganizationSchema();
    expect(org['@context']).toBe('https://schema.org');
    expect(org['@type']).toBe('Organization');
    expect(org.name).toBe('پروتئین ایرانی');
    expect(org.url).toBe('https://proteinirany.ir');
    expect(org.email).toBe('support@proteinirany.ir');
  });

  it('generates valid WebSite schema with SearchAction', () => {
    const site = generateWebSiteSchema();
    expect(site['@context']).toBe('https://schema.org');
    expect(site['@type']).toBe('WebSite');
    expect(site.url).toBe('https://proteinirany.ir');
    expect(site.potentialAction).toEqual({
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://proteinirany.ir/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    });
  });

  it('generates valid Product schema with Offer and Iranian Rial pricing', () => {
    const product = generateProductSchema({
      slug: 'turkey-ham-90',
      nameFa: 'ژامبون بوقلمون ۹۰٪ آندره',
      descriptionFa: 'ژامبون بوقلمون دودی با کیفیت ممتاز',
      brandNameFa: 'آندره',
      images: ['https://proteinirany.ir/images/turkey.png'],
      sku: 'ANDRE-TH90',
      inStock: true,
      basePriceRials: 2850000,
    });

    expect(product['@context']).toBe('https://schema.org');
    expect(product['@type']).toBe('Product');
    expect(product.name).toBe('ژامبون بوقلمون ۹۰٪ آندره');
    expect(product.description).toBe('ژامبون بوقلمون دودی با کیفیت ممتاز');
    expect(product.brand).toEqual({
      '@type': 'Brand',
      name: 'آندره',
    });
    expect(product.image).toEqual(['https://proteinirany.ir/images/turkey.png']);
    expect(product.sku).toBe('ANDRE-TH90');
    expect(product.offers).toEqual({
      '@type': 'Offer',
      price: 2850000,
      priceCurrency: 'IRR',
      availability: 'https://schema.org/InStock',
      url: 'https://proteinirany.ir/products/turkey-ham-90',
    });
  });

  it('handles out of stock and fallback defaults in Product schema', () => {
    const product = generateProductSchema({
      slug: 'out-of-stock-bacon',
      nameFa: 'بیکن گوشت',
      inStock: false,
    });

    expect(product.offers.availability).toBe('https://schema.org/OutOfStock');
    expect(product.brand.name).toBe('پروتئین ایرانی');
    expect(product.image.length).toBeGreaterThan(0);
  });

  it('generates valid BreadcrumbList schema', () => {
    const breadcrumb = generateBreadcrumbsSchema([
      { name: 'خانه', url: 'https://proteinirany.ir' },
      { name: 'سوسیس و کالباس', url: 'https://proteinirany.ir/category/coldcuts' },
      { name: 'ژامبون بوقلمون', url: 'https://proteinirany.ir/products/turkey-ham-90' },
    ]);

    expect(breadcrumb['@context']).toBe('https://schema.org');
    expect(breadcrumb['@type']).toBe('BreadcrumbList');
    expect(breadcrumb.itemListElement).toHaveLength(3);
    expect(breadcrumb.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'خانه',
      item: 'https://proteinirany.ir',
    });
    expect(breadcrumb.itemListElement[2].position).toBe(3);
  });
});
