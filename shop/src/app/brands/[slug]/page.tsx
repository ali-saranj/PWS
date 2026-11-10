import { notFound, permanentRedirect } from 'next/navigation';
import { fetchBrandBySlug } from '@/lib/serverCatalog';
import type { Metadata } from 'next';

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await fetchBrandBySlug(slug);

  if (!brand) {
    return {
      title: 'برند یافت نشد | سبد سبز',
    };
  }

  const title = brand.nameEn
    ? `محصولات برند ${brand.nameFa} (${brand.nameEn}) | سبد سبز`
    : `محصولات برند ${brand.nameFa} | سبد سبز`;

  return {
    title,
    description: `خرید آنلاین انواع محصولات برند معتبر ${brand.nameFa} با تضمین کیفیت و ارسال روز در سوپرمارکت آنلاین سبد سبز`,
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = await fetchBrandBySlug(slug);

  if (!brand) {
    notFound();
    return null;
  }

  permanentRedirect(`/products?brandSlug=${encodeURIComponent(brand.slug)}`);
}
