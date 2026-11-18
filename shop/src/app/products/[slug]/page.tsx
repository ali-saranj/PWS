import React from 'react';
import type { Metadata } from 'next';
import { BRAND } from '@/config/branding';
import { fetchProductBySlug } from '@/lib/serverCatalog';
import { getProductDetailBySlug } from '@/lib/productDetail';
import { generateProductSchema, generateBreadcrumbsSchema } from '@/lib/jsonLd';
import { ProductDetailView } from '@/components/product/ProductDetailView';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function resolveProduct(slug: string) {
  const serverData = await fetchProductBySlug(slug);
  if (serverData) return serverData;
  const mockData = getProductDetailBySlug(slug);
  return mockData;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolveProduct(slug);

  if (!product) {
    return {
      title: `محصول یافت نشد | ${BRAND.nameFa}`,
      description: 'محصول مورد نظر در فروشگاه پروتئین ایرانی یافت نشد.',
    };
  }

  const brandName = product.brandNameFa || BRAND.nameFa;
  const title = `${product.nameFa} | ${brandName}`;
  const description =
    (product as any).descriptionFa ||
    (product as any).descriptionHtml?.replace(/<[^>]*>?/gm, '') ||
    `خرید آنلاین ${product.nameFa} با ضمانت تازگی و ارسال فوری در سوپرمارکت پروتئین ایرانی.`;
  const canonicalUrl = `${BRAND.domain}/products/${encodeURIComponent(slug)}`;

  let rawImages: string[] = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    rawImages = product.images.map((img: any) =>
      typeof img === 'string' ? img : img.url || img.thumbUrl
    );
  } else {
    rawImages = ['/images/products/turkey-ham.png'];
  }

  const primaryImage = rawImages[0].startsWith('http')
    ? rawImages[0]
    : `${BRAND.domain}${rawImages[0]}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      url: canonicalUrl,
      siteName: BRAND.nameFa,
      title,
      description,
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 800,
          alt: product.nameFa,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [primaryImage],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await resolveProduct(slug);

  let productSchema = null;
  let breadcrumbSchema = null;

  if (product) {
    let rawImages: string[] = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      rawImages = product.images.map((img: any) =>
        typeof img === 'string' ? img : img.url || img.thumbUrl
      );
    }

    const firstVariant = (product.variants as any)?.[0];
    const basePriceRials =
      (product as any).basePriceRials ||
      firstVariant?.basePriceRials ||
      ((product as any).priceToman ? (product as any).priceToman * 10 : 0);

    const descriptionFa =
      (product as any).descriptionFa ||
      (product as any).descriptionHtml?.replace(/<[^>]*>?/gm, '');

    productSchema = generateProductSchema({
      slug,
      nameFa: product.nameFa,
      descriptionFa,
      brandNameFa: product.brandNameFa,
      images: rawImages,
      sku: firstVariant?.sku || slug,
      inStock: product.inStock,
      basePriceRials,
    });

    const categoryName = product.categoryNameFa || 'محصولات';
    const categoryUrl = product.categoryId
      ? `${BRAND.domain}/products?categoryId=${product.categoryId}`
      : `${BRAND.domain}/products`;

    breadcrumbSchema = generateBreadcrumbsSchema([
      { name: 'صفحه اصلی', url: BRAND.domain },
      { name: categoryName, url: categoryUrl },
      { name: product.nameFa, url: `${BRAND.domain}/products/${encodeURIComponent(slug)}` },
    ]);
  }

  return (
    <>
      {productSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productSchema),
          }}
        />
      ) : null}
      {breadcrumbSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema),
          }}
        />
      ) : null}
      <ProductDetailView slug={slug} initialProduct={product} />
    </>
  );
}
