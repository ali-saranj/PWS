import { describe, it, expect, vi } from 'vitest';
import ProductRedirectPage from './page';
import * as navigation from 'next/navigation';

vi.mock('next/navigation', () => ({
  permanentRedirect: vi.fn(),
}));

describe('Product singular route redirect', () => {
  it('permanently redirects /product/:slug to /products/:slug', async () => {
    await ProductRedirectPage({
      params: Promise.resolve({ slug: 'turkey-ham-90' }),
    });

    expect(navigation.permanentRedirect).toHaveBeenCalledWith(
      '/products/turkey-ham-90'
    );
  });
});
