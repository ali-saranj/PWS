import type { MetadataRoute } from 'next';
import { BRAND } from '@/config/branding';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/shop/catalog/', '/api/shop/auth/me'],
        disallow: ['/profile', '/checkout', '/auth', '/track', '/api/'],
      },
    ],
    sitemap: `${BRAND.domain}/sitemap.xml`,
  };
}
