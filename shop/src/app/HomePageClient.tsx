'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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

export default function HomePageClient() {
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

      {/* 7. Topical SEO Intro & Internal Links */}
      <section className="rounded-3xl bg-white border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-gray-900">
          فروشگاه اینترنتی پروتئینی «پروتئین ایرانی» در اصفهان
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          فروشگاه پروتئینی پروتئین ایرانی مرجع خرید آنلاین فرآورده‌های پروتئینی تازه در اصفهان است. در کاتالوگ ما می‌توانید برای{' '}
          <Link href="/products?categorySlug=sausage-hotdog" className="text-primary font-semibold hover:underline">
            خرید سوسیس و هات‌داگ
          </Link>
          ،{' '}
          <Link href="/products?categorySlug=ham-coldcuts" className="text-primary font-semibold hover:underline">
            خرید کالباس، ژامبون و بیکن
          </Link>
          ،{' '}
          <Link href="/products?categorySlug=dairy-cheese" className="text-primary font-semibold hover:underline">
            خرید پنیر پیتزا و گودا
          </Link>{' '}
          و{' '}
          <Link href="/products?categorySlug=pickles" className="text-primary font-semibold hover:underline">
            خرید خیارشور و ترشیجات
          </Link>{' '}
          از بهترین برندها اقدام کنید.
        </p>
        <div className="flex flex-wrap gap-3 pt-1 text-xs sm:text-sm font-semibold">
          <Link href="/brands" className="px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-800 hover:text-primary transition-colors">
            مشاهده برندهای معتبر (آندره، کاله، ۲۰۲ و سروش)
          </Link>
          <Link href="/wholesale" className="px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-800 hover:text-primary transition-colors">
            خرید عمده سوسیس و کالباس و مواد اولیه فست‌فود
          </Link>
          <Link href="/shipping" className="px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-800 hover:text-primary transition-colors">
            ارسال سریع با بسته‌بندی عایق و زنجیره سرد
          </Link>
        </div>
      </section>
    </div>
  );
}
