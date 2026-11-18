import { BRAND } from '@/config/branding';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ProductSchemaInput {
  slug: string;
  nameFa: string;
  descriptionFa?: string;
  brandNameFa?: string;
  images?: string[];
  sku?: string;
  inStock?: boolean;
  basePriceRials?: number;
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.nameFa,
    alternateName: BRAND.nameEn,
    url: BRAND.domain,
    logo: `${BRAND.domain}/images/logo.png`,
    email: BRAND.supportEmail,
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND.nameFa,
    url: BRAND.domain,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BRAND.domain}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateProductSchema(input: ProductSchemaInput) {
  const images =
    input.images && input.images.length > 0
      ? input.images.map((img) =>
          img.startsWith('http') ? img : `${BRAND.domain}${img}`
        )
      : [`${BRAND.domain}/images/products/turkey-ham.png`];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.nameFa,
    description:
      input.descriptionFa ||
      `خرید آنلاین ${input.nameFa} با کیفیت عالی و ارسال فوری از ${BRAND.nameFa}`,
    image: images,
    sku: input.sku || input.slug,
    brand: {
      '@type': 'Brand',
      name: input.brandNameFa || BRAND.nameFa,
    },
    offers: {
      '@type': 'Offer',
      price: input.basePriceRials ?? 0,
      priceCurrency: 'IRR',
      availability:
        input.inStock !== false
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: `${BRAND.domain}/products/${encodeURIComponent(input.slug)}`,
    },
  };
}

export function generateBreadcrumbsSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
