import { permanentRedirect } from 'next/navigation';

interface ProductRedirectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductRedirectPage({
  params,
}: ProductRedirectPageProps) {
  const { slug } = await params;
  permanentRedirect(`/products/${encodeURIComponent(slug)}`);
}
