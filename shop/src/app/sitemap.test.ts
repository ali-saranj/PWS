import { describe, it, expect, vi } from 'vitest';
import * as serverCatalog from '@/lib/serverCatalog';
import sitemap from './sitemap';

describe('sitemap metadata route', () => {
  it('generates full sitemap with static and dynamic catalog routes', async () => {
    vi.spyOn(serverCatalog, 'fetchSitemapEntries').mockResolvedValue({
      products: [{ slug: 'turkey-ham-90' }],
      categories: [{ slug: 'sausages' }],
      brands: [{ slug: 'andre' }],
    });

    const entries = await sitemap();
    expect(entries).toBeDefined();
    expect(Array.isArray(entries)).toBe(true);

    const urls = entries.map((e) => e.url);

    // Core static routes
    expect(urls).toContain('https://proteinirany.ir/');
    expect(urls).toContain('https://proteinirany.ir/products');
    expect(urls).toContain('https://proteinirany.ir/categories');
    expect(urls).toContain('https://proteinirany.ir/brands');
    expect(urls).toContain('https://proteinirany.ir/discounts');
    expect(urls).toContain('https://proteinirany.ir/about');
    expect(urls).toContain('https://proteinirany.ir/contact');

    // Dynamic catalog routes (clean 200 OK URLs matching canonicals)
    expect(urls).toContain('https://proteinirany.ir/products/turkey-ham-90');
    expect(urls).toContain('https://proteinirany.ir/products?categorySlug=sausages');
    expect(urls).toContain('https://proteinirany.ir/products?brandSlug=andre');

    // Verify no redirecting legacy routes exist in sitemap
    expect(urls.some((u) => u.includes('/category/'))).toBe(false);
    expect(urls.some((u) => u.startsWith('https://proteinirany.ir/brands/'))).toBe(false);

    // Home priority check
    const homeEntry = entries.find((e) => e.url === 'https://proteinirany.ir/');
    expect(homeEntry?.priority).toBe(1.0);
    expect(homeEntry?.changeFrequency).toBe('daily');

    // Product priority check
    const productEntry = entries.find(
      (e) => e.url === 'https://proteinirany.ir/products/turkey-ham-90'
    );
    expect(productEntry?.priority).toBe(0.8);
  });
});
