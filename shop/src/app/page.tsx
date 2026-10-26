'use client';

import React, { useEffect, useState } from 'react';
import HeroBanner from '@/components/HeroBanner';
import CategoryCircles, { DEFAULT_CATEGORIES } from '@/components/CategoryCircles';
import PromoTiles from '@/components/PromoTiles';
import SpecialOffersCarousel, {
  DEFAULT_SPECIAL_OFFERS,
  type ProductItem,
} from '@/components/SpecialOffersCarousel';
import ValueBadges from '@/components/ValueBadges';
import PopularProductsCarousel, {
  DEFAULT_POPULAR_PRODUCTS,
  type PopularProductItem,
} from '@/components/PopularProductsCarousel';

interface HomeCatalogResponse {
  categories?: Array<{
    id: number;
    title?: string;
    nameFa: string;
    nameEn?: string;
    slug: string;
    icon?: string;
  }>;
  specialOffers?: ProductItem[];
  popularProducts?: PopularProductItem[];
}

export default function HomePage() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [specialOffers, setSpecialOffers] = useState<ProductItem[]>(DEFAULT_SPECIAL_OFFERS);
  const [popularProducts, setPopularProducts] = useState<PopularProductItem[]>(
    DEFAULT_POPULAR_PRODUCTS
  );

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        const res = await fetch('/api/shop/catalog/home');
        if (!res.ok) return;
        const data: HomeCatalogResponse = await res.json();
        if (!isMounted) return;

        if (data.categories && data.categories.length > 0) {
          setCategories(
            data.categories.map((c) => ({
              id: c.id,
              nameFa: c.nameFa || c.title || '',
              slug: c.slug,
            }))
          );
        }

        if (data.specialOffers && data.specialOffers.length > 0) {
          setSpecialOffers(data.specialOffers);
        }

        if (data.popularProducts && data.popularProducts.length > 0) {
          setPopularProducts(data.popularProducts);
        }
      } catch {
        // Graceful fallback to rich defaults when offline, in tests, or if backend is not yet populated
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* 1. Hero Banner */}
      <HeroBanner />

      {/* 2. Category Circles */}
      <CategoryCircles categories={categories} />

      {/* 3. Promotional Tiles */}
      <PromoTiles />

      {/* 4. Special Offers Carousel */}
      <SpecialOffersCarousel products={specialOffers} />

      {/* 5. Value Badges */}
      <ValueBadges />

      {/* 6. Popular Products Carousel */}
      <PopularProductsCarousel products={popularProducts} />
    </div>
  );
}
