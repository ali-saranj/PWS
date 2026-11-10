import { notFound, permanentRedirect } from 'next/navigation';
import { fetchCategoryBySlug } from '@/lib/serverCatalog';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);

  if (!category) {
    notFound();
    return null;
  }

  permanentRedirect(`/products?categorySlug=${encodeURIComponent(category.slug)}`);
}
