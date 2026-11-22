import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ProductDetailPage, { generateMetadata } from './[slug]/page';
import { useCartStore } from '@/lib/cartStore';

describe('ProductDetailPage (PDP)', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      isOpen: false,
    });
    vi.restoreAllMocks();
  });

  it('renders PDP with product details, variants, volume tiers, breadcrumbs, and tabs', async () => {
    render(await ProductDetailPage({ params: Promise.resolve({ slug: 'andre-turkey-ham-90' }) }));

    await waitFor(() => {
      const breadcrumbNav = screen.getByRole('navigation', { name: /مسیر راهنما/i });
      expect(within(breadcrumbNav).getByText(/صفحه اصلی/i)).toBeInTheDocument();
      expect(within(breadcrumbNav).getByText(/کالباس و ژامبون/i)).toBeInTheDocument();
      expect(within(breadcrumbNav).getByText(/ژامبون بوقلمون ۹۰٪ آندره/i)).toBeInTheDocument();
    });

    // Product Title & Brand
    expect(
      screen.getByRole('heading', { level: 1, name: /ژامبون بوقلمون ۹۰٪ آندره/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/برند:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/آندره/i).length).toBeGreaterThan(0);

    // Variant options
    expect(screen.getAllByText(/۲۵۰ گرم اسلایس/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('radio', { name: /۵۰۰ گرم/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /۱ کیلوگرم/i })).toBeInTheDocument();

    // Volume discount tiers table
    expect(screen.getByText(/تخفیف پلکانی و خرید عمده/i)).toBeInTheDocument();
    expect(screen.getByText(/۳ عدد به بالا/i)).toBeInTheDocument();
    expect(screen.getByText(/۶ عدد به بالا/i)).toBeInTheDocument();

    // Badges / Fresh guarantee
    expect(screen.getByText(/ضمانت تازگی دلی/i)).toBeInTheDocument();

    // Related products
    expect(screen.getByText(/محصولات مشابه/i)).toBeInTheDocument();

    // Specifications tab / info
    expect(screen.getByText(/مشخصات محصول/i)).toBeInTheDocument();
  });

  it('switching variants updates selected price, portion label, and stock status', async () => {
    render(await ProductDetailPage({ params: Promise.resolve({ slug: 'andre-turkey-ham-90' }) }));

    await waitFor(() => {
      expect(screen.getAllByText(/۲۵۰ گرم اسلایس/i).length).toBeGreaterThan(0);
    });

    // Check initial variant price (240,000 Toman)
    expect(screen.getByTestId('active-price')).toHaveTextContent(/۲۴۰[,٬]۰۰۰/);

    // Switch to 500g variant
    const variant500 = screen.getByRole('radio', { name: /۵۰۰ گرم/i });
    fireEvent.click(variant500);

    // Price updates to 460,000 Toman
    await waitFor(() => {
      expect(screen.getByTestId('active-price')).toHaveTextContent(/۴۶۰[,٬]۰۰۰/);
    });

    // In stock status in Buy Box
    const buyBox = screen.getByTestId('buy-box-card');
    expect(within(buyBox).getByText(/موجود در انبار/i)).toBeInTheDocument();
  });

  it('highlights the active qualifying tier when quantity reaches volume threshold', async () => {
    render(await ProductDetailPage({ params: Promise.resolve({ slug: 'andre-turkey-ham-90' }) }));

    await waitFor(() => {
      expect(screen.getByText(/تخفیف پلکانی و خرید عمده/i)).toBeInTheDocument();
    });

    const tier3Row = screen.getByTestId('volume-tier-3');
    expect(tier3Row).toHaveAttribute('data-active', 'false');

    // Increase quantity to 3
    const incrementBtn = screen.getByRole('button', { name: /افزایش تعداد/i });
    fireEvent.click(incrementBtn); // 2
    fireEvent.click(incrementBtn); // 3

    expect(screen.getByTestId('quantity-display')).toHaveTextContent(/۳/);

    // Tier 3 should now be highlighted active
    await waitFor(() => {
      expect(screen.getByTestId('volume-tier-3')).toHaveAttribute('data-active', 'true');
    });
  });

  it('changing quantity and clicking "افزودن به سبد خرید" adds item with correct quantity to useCartStore', async () => {
    render(await ProductDetailPage({ params: Promise.resolve({ slug: 'andre-turkey-ham-90' }) }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /ژامبون بوقلمون ۹۰٪ آندره/i })).toBeInTheDocument();
    });

    // Set quantity to 2
    const incrementBtn = screen.getByRole('button', { name: /افزایش تعداد/i });
    fireEvent.click(incrementBtn);

    const addToCartBtn = screen.getByRole('button', { name: /افزودن به سبد خرید/i });
    fireEvent.click(addToCartBtn);

    const cartItems = useCartStore.getState().items;
    expect(cartItems.length).toBe(1);
    expect(cartItems[0].quantity).toBe(2);
    expect(cartItems[0].name).toContain('ژامبون بوقلمون ۹۰٪ آندره');
    expect(cartItems[0].variantName).toContain('۲۵۰ گرم اسلایس');
  });

  it('handles out-of-stock products gracefully with disabled add to cart', async () => {
    render(await ProductDetailPage({ params: Promise.resolve({ slug: 'andre-bulgarian-smoked' }) }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /سوسیس بلغاری دودی/i })).toBeInTheDocument();
    });

    expect(screen.getAllByText(/ناموجود/i).length).toBeGreaterThan(0);
    const disabledButtons = screen.getAllByRole('button', { name: /ناموجود/i });
    expect(disabledButtons.length).toBeGreaterThanOrEqual(1);
    disabledButtons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('calls real API /api/shop/catalog/products/${slug}, maps real database variant ID, and passes real variant ID to cart', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/shop/catalog/products/real-salami-slug')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                id: 55,
                slug: 'real-salami-slug',
                nameFa: 'سالامی ممتاز واقعی',
                nameEn: 'Real Premium Salami',
                brandNameFa: 'میکائیلیان',
                categoryId: 3,
                categoryNameFa: 'کالباس و سالامی',
                inStock: true,
                variants: [
                  {
                    id: 5501,
                    sku: 'SALAMI-5501',
                    sizeLabel: 'بسته ۲۵۰ گرمی اسلایس',
                    priceToman: 195000,
                    stockOnHand: 15,
                    inStock: true,
                    tiers: [],
                  },
                ],
              })
            ),
          json: () =>
            Promise.resolve({
              id: 55,
              slug: 'real-salami-slug',
              nameFa: 'سالامی ممتاز واقعی',
              nameEn: 'Real Premium Salami',
              brandNameFa: 'میکائیلیان',
              categoryId: 3,
              categoryNameFa: 'کالباس و سالامی',
              inStock: true,
              variants: [
                {
                  id: 5501,
                  sku: 'SALAMI-5501',
                  sizeLabel: 'بسته ۲۵۰ گرمی اسلایس',
                  priceToman: 195000,
                  stockOnHand: 15,
                  inStock: true,
                  tiers: [],
                },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{}'),
        json: () => Promise.resolve({}),
      });
    });

    render(await ProductDetailPage({ params: Promise.resolve({ slug: 'real-salami-slug' }) }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /سالامی ممتاز واقعی/i })).toBeInTheDocument();
    });

    const addToCartBtn = screen.getByRole('button', { name: /افزودن به سبد خرید/i });
    fireEvent.click(addToCartBtn);

    const cartItems = useCartStore.getState().items;
    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].productId).toBe(55);
    expect(cartItems[0].variantId).toBe(5501);
  });

  it('renders 3-column layout on desktop, dedicated Buy Box card, and mobile sticky action bar', async () => {
    render(await ProductDetailPage({ params: Promise.resolve({ slug: 'andre-turkey-ham-90' }) }));

    await waitFor(() => {
      expect(screen.getByTestId('gallery-container')).toBeInTheDocument();
      expect(screen.getByTestId('buy-box-card')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-sticky-bar')).toBeInTheDocument();
    });

    // Check Buy Box card content
    const buyBox = screen.getByTestId('buy-box-card');
    expect(within(buyBox).getByTestId('active-price')).toHaveTextContent(/۲۴۰[,٬]۰۰۰/);
    expect(within(buyBox).getByRole('button', { name: /افزودن به سبد خرید/i })).toBeInTheDocument();

    // Check mobile sticky bar
    const mobileBar = screen.getByTestId('mobile-sticky-bar');
    expect(within(mobileBar).getByText(/۲۴۰[,٬]۰۰۰/)).toBeInTheDocument();
    const mobileAddBtn = within(mobileBar).getByRole('button', { name: /افزودن به سبد/i });
    expect(mobileAddBtn).toBeInTheDocument();
    fireEvent.click(mobileAddBtn);

    const cartItems = useCartStore.getState().items;
    expect(cartItems.length).toBeGreaterThan(0);
  });

  it('generates dynamic SEO metadata including title, canonical URL, and OpenGraph', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: 'andre-turkey-ham-90' }),
    });

    expect(meta.title).toBe('ژامبون بوقلمون ۹۰٪ آندره | آندره');
    expect(meta.description).toContain('ژامبون بوقلمون');
    expect(meta.alternates?.canonical).toBe(
      'https://proteinirany.ir/products/andre-turkey-ham-90'
    );
    expect(meta.openGraph?.url).toBe(
      'https://proteinirany.ir/products/andre-turkey-ham-90'
    );
    expect(meta.openGraph?.siteName).toBe('پروتئین ایرانی');
    expect((meta.twitter as any)?.card).toBe('summary_large_image');
  });

  it('injects JSON-LD scripts for Product and BreadcrumbList schemas', async () => {
    const { container } = render(
      await ProductDetailPage({ params: Promise.resolve({ slug: 'andre-turkey-ham-90' }) })
    );

    const scriptTags = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]')
    );
    expect(scriptTags.length).toBe(2);

    const parsed = scriptTags.map((s) => JSON.parse(s.textContent || '{}'));
    const productSchema = parsed.find((p) => p['@type'] === 'Product');
    const breadcrumbSchema = parsed.find((p) => p['@type'] === 'BreadcrumbList');

    expect(productSchema).toBeDefined();
    expect(productSchema.name).toBe('ژامبون بوقلمون ۹۰٪ آندره');
    expect(productSchema.offers.priceCurrency).toBe('IRR');

    expect(breadcrumbSchema).toBeDefined();
    expect(breadcrumbSchema.itemListElement.length).toBeGreaterThanOrEqual(3);
  });

  it('renders server-provided related products with real catalog slugs and no fake slugs', async () => {
    const { container } = render(
      await ProductDetailPage({ params: Promise.resolve({ slug: 'andre-turkey-ham-90' }) })
    );

    await waitFor(() => {
      expect(screen.getByText(/محصولات مشابه/i)).toBeInTheDocument();
    });

    // Check all links inside the related products section
    const relatedSection = screen.getByText(/محصولات مشابه/i).closest('section');
    expect(relatedSection).not.toBeNull();

    // Must NOT contain dummy placeholder slugs
    const renderedHtml = container.innerHTML;
    expect(renderedHtml).not.toContain('related-1');
    expect(renderedHtml).not.toContain('related-2');

    // Must contain real catalog links (such as /product/mikaelian-dry-salami)
    const links = within(relatedSection!).getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs.some((h) => h?.includes('/product/'))).toBe(true);
    expect(hrefs.some((h) => h?.includes('related-1') || h?.includes('related-2'))).toBe(false);
  });
});
