'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Star,
  Truck,
  ShieldCheck,
  ThermometerSnowflake,
  Clock,
  Sparkles,
  Info,
  ListFilter,
  MessageSquare,
  Share2,
  Heart,
} from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { VariantSelector } from '@/components/product/VariantSelector';
import { VolumeTierTable } from '@/components/product/VolumeTierTable';
import {
  getProductDetailBySlug,
  ProductDetailData,
  ProductVariant,
  VolumeTier,
} from '@/lib/productDetail';
import { useCartStore } from '@/lib/cartStore';
import { formatToman, toPersianDigits } from '@/lib/format';
import { api } from '@/lib/api';

function mapBackendProductToDetail(backend: any): ProductDetailData {
  const variants: ProductVariant[] = (backend.variants || []).map((v: any) => {
    const label = v.sizeLabel || v.flavourFa || (v.weightGrams ? `${v.weightGrams} گرم` : 'استاندارد');
    return {
      id: v.id,
      nameFa: label,
      weightLabel: label,
      priceToman: v.priceToman || Math.round((v.basePriceRials || 0) / 10),
      compareAtPriceToman: v.compareAtPriceToman || (v.compareAtPriceRials ? Math.round(v.compareAtPriceRials / 10) : undefined),
      discountPercent: v.discountPercent ?? undefined,
      stock: v.stockOnHand ?? 0,
      inStock: v.inStock ?? (v.stockOnHand > 0),
      sku: v.sku,
    };
  });

  const volumeTiers: VolumeTier[] = [];
  if (backend.variants) {
    for (const v of backend.variants) {
      if (v.tiers && v.tiers.length > 0) {
        for (const t of v.tiers) {
          if (!volumeTiers.some((vt) => vt.minQuantity === t.minQty)) {
            volumeTiers.push({
              minQuantity: t.minQty,
              discountPercent: t.discountPercent,
              tierLabel: `${t.minQty} عدد به بالا: ${t.discountPercent}٪ تخفیف`,
            });
          }
        }
      }
    }
  }

  const images: string[] = (backend.images && backend.images.length > 0)
    ? backend.images.map((img: any) => (typeof img === 'string' ? img : img.url || img.thumbUrl))
    : ['/images/products/turkey-ham.png'];

  const categoryBreadcrumb = backend.breadcrumb && backend.breadcrumb.length > 0
    ? backend.breadcrumb[backend.breadcrumb.length - 1]
    : null;

  return {
    id: backend.id,
    slug: backend.slug,
    nameFa: backend.nameFa,
    nameEn: backend.nameEn,
    brandNameFa: backend.brandNameFa || '',
    brandId: backend.brandId,
    categoryId: backend.categoryId,
    categoryNameFa: backend.categoryNameFa || '',
    categorySlug: categoryBreadcrumb?.slug || backend.categorySlug || 'coldcuts',
    descriptionHtml: backend.descriptionFa || backend.descriptionEn || '',
    images,
    badges: backend.badges || [],
    isBestseller: backend.featured || false,
    freshDeliGuarantee: true,
    variants,
    volumeTiers,
    specifications: [
      { label: 'برند', value: backend.brandNameFa || 'پروتئین ایرانی' },
      { label: 'دسته‌بندی', value: backend.categoryNameFa || 'پروتئینی' },
    ],
    inStock: backend.inStock ?? variants.some((v) => v.inStock),
    totalStock: variants.reduce((sum, v) => sum + (v.stock || 0), 0),
  };
}

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

function ProductDetailPageContent({ slug }: { slug: string }) {
  const initialMock = useMemo(() => getProductDetailBySlug(slug), [slug]);
  const [product, setProduct] = useState<ProductDetailData | null>(initialMock);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    () => (initialMock && initialMock.variants.length > 0 ? initialMock.variants[0] : null)
  );

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      try {
        const res = await api.get<any>(`/api/shop/catalog/products/${encodeURIComponent(slug)}`);
        if (isMounted && res && res.id) {
          const detail = mapBackendProductToDetail(res);
          setProduct(detail);
          if (detail.variants.length > 0) {
            setSelectedVariant(detail.variants[0]);
          }
        }
      } catch {
        // Fall back to initial mock if network/request fails
      }
    }
    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [slug]);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'desc' | 'reviews'>('specs');
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const defaultRelated = useMemo(() => {
    if (!product) return [];
    return [
      {
        id: 991,
        slug: 'related-1',
        nameFa: 'سوسیس کراکف پنیری',
        brandNameFa: '۲۰۲',
        priceToman: 260000,
        inStock: true,
      },
      {
        id: 992,
        slug: 'related-2',
        nameFa: 'بیکن بوقلمون دودی',
        brandNameFa: 'آندره',
        priceToman: 290000,
        inStock: true,
      },
    ];
  }, [product]);

  const [relatedProducts, setRelatedProducts] = useState<any[]>(defaultRelated);

  useEffect(() => {
    setRelatedProducts(defaultRelated);
  }, [defaultRelated]);

  useEffect(() => {
    let isMounted = true;
    async function loadRelated() {
      if (!product?.categoryId) return;
      try {
        const res = await api.get<any>(
          `/api/shop/catalog/products?categoryId=${product.categoryId}&size=4`
        );
        if (isMounted && res?.content && res.content.length > 0) {
          setRelatedProducts(res.content.filter((p: any) => p.slug !== product.slug).slice(0, 4));
        }
      } catch {
        // ignore
      }
    }
    loadRelated();
    return () => {
      isMounted = false;
    };
  }, [product?.categoryId, product?.slug]);

  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <Info className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          محصول مورد نظر یافت نشد
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          ممکن است این محصول حذف شده باشد یا آدرس وارد شده نادرست است.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  const currentVariant = selectedVariant || (product.variants.length > 0 ? product.variants[0] : null);
  if (!currentVariant) {
    return null;
  }
  const isAvailable =
    product.inStock &&
    currentVariant.inStock &&
    (currentVariant.stock === undefined || currentVariant.stock > 0);

  // Volume discount calculation
  const activeTier = [...product.volumeTiers]
    .sort((a, b) => b.minQuantity - a.minQuantity)
    .find((tier) => quantity >= tier.minQuantity);

  const effectiveUnitPrice = activeTier
    ? Math.round(
        currentVariant.priceToman * (1 - activeTier.discountPercent / 100)
      )
    : currentVariant.priceToman;

  const totalCalculatedPrice = effectiveUnitPrice * quantity;

  const handleIncrement = () => {
    const max = currentVariant.stock ?? 99;
    if (quantity < max) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!isAvailable) return;

    addItem({
      id: `product-${product.id}-variant-${currentVariant.id}`,
      productId: product.id,
      variantId: currentVariant.id,
      name: product.nameFa,
      variantName: currentVariant.nameFa,
      priceToman: effectiveUnitPrice,
      imageUrl: product.images[0],
      unit: currentVariant.weightLabel,
      maxStock: currentVariant.stock ?? 99,
      quantity: quantity,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1800);
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumbs Navigation */}
        <nav
          className="flex items-center gap-1.5 text-xs text-gray-500 mb-6 overflow-x-auto pb-1"
          aria-label="مسیر راهنما"
        >
          <Link href="/" className="hover:text-emerald-600 transition-colors">
            صفحه اصلی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <Link
            href={`/products?categoryId=${product.categoryId}`}
            className="hover:text-emerald-600 transition-colors"
          >
            {product.categoryNameFa}
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-gray-900 font-bold truncate">
            {product.nameFa}
          </span>
        </nav>

        {/* Main Product Section */}
        <div className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-xs mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Gallery Column (5 cols) */}
            <div className="lg:col-span-5">
              <ProductImageGallery
                images={product.images}
                title={product.nameFa}
                discountPercent={currentVariant.discountPercent}
                isBestseller={product.isBestseller}
                freshDeliGuarantee={product.freshDeliGuarantee}
                badges={product.badges}
              />
            </div>

            {/* Info and Actions Column (7 cols) */}
            <div className="lg:col-span-7 flex flex-col">
              {/* Brand and Actions */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">برند:</span>
                  <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                    {product.brandNameFa}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1.5 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    aria-label="افزودن به علاقه‌مندی‌ها"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    aria-label="اشتراک‌گذاری محصول"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Product Titles */}
              <h1 className="text-xl sm:text-2xl font-black text-gray-950 mb-1 leading-snug">
                {product.nameFa}
              </h1>
              {product.nameEn ? (
                <p className="text-xs font-sans text-gray-400 mb-3" dir="ltr">
                  {product.nameEn}
                </p>
              ) : null}

              {/* Rating and Reviews */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-black text-gray-800">
                    {toPersianDigits(product.rating || 4.8)}
                  </span>
                </div>
                <span className="text-gray-300">|</span>
                <span>
                  {toPersianDigits(product.reviewCount || 24)} نظر ثبت شده کاربران
                </span>
              </div>

              {/* Variant Selector */}
              <div className="mb-6">
                <VariantSelector
                  variants={product.variants}
                  selectedVariantId={currentVariant.id}
                  onSelectVariant={(v) => {
                    setSelectedVariant(v);
                    setQuantity(1);
                  }}
                />
              </div>

              {/* Price and Stock Box */}
              <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    قیمت هر واحد ({currentVariant.nameFa}):
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      data-testid="active-price"
                      className="text-2xl sm:text-3xl font-black text-emerald-700"
                    >
                      {formatToman(effectiveUnitPrice)}
                    </span>
                    <span className="text-xs text-gray-500 font-bold">تومان</span>

                    {currentVariant.compareAtPriceToman &&
                    currentVariant.compareAtPriceToman > effectiveUnitPrice ? (
                      <span className="text-sm text-gray-400 line-through mr-1 font-medium">
                        {formatToman(currentVariant.compareAtPriceToman)}
                      </span>
                    ) : null}
                  </div>
                </div>

                {isAvailable ? (
                  <div className="flex flex-col sm:items-end text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>آماده ارسال فوری دلی</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-normal mt-0.5">
                      نگهداری در زنجیره سرمایش استاندارد
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                    ناموجود
                  </span>
                )}
              </div>

              {/* Quantity Counter & Add to Cart Action */}
              <div className="pt-2 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Quantity Controls */}
                <div
                  className="inline-flex items-center justify-between bg-gray-100/90 rounded-2xl p-1.5 border border-gray-200/80 w-full sm:w-auto sm:min-w-[140px]"
                  role="group"
                  aria-label="انتخاب تعداد"
                >
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={!isAvailable || quantity >= (currentVariant.stock ?? 99)}
                    aria-label="افزایش تعداد"
                    className="w-10 h-10 rounded-xl bg-white hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40 disabled:hover:bg-white text-gray-700 flex items-center justify-center transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <span
                    data-testid="quantity-display"
                    className="text-base font-black text-gray-900 px-3 select-none"
                  >
                    {toPersianDigits(quantity)}
                  </span>

                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={!isAvailable || quantity <= 1}
                    aria-label="کاهش تعداد"
                    className="w-10 h-10 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 disabled:hover:bg-white text-gray-700 flex items-center justify-center transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <Minus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!isAvailable}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-black text-sm transition-all duration-200 shadow-md ${
                    !isAvailable
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : isAdded
                      ? 'bg-emerald-700 text-white shadow-emerald-700/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 hover:shadow-lg active:scale-[0.99]'
                  }`}
                >
                  {!isAvailable ? (
                    <span>ناموجود</span>
                  ) : isAdded ? (
                    <>
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>به سبد خرید افزوده شد</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                      <span>افزودن به سبد خرید</span>
                      {quantity > 1 ? (
                        <span className="text-xs bg-emerald-500/80 px-2 py-0.5 rounded-full mr-1">
                          ({formatToman(totalCalculatedPrice)} تومان)
                        </span>
                      ) : null}
                    </>
                  )}
                </button>
              </div>

              {/* Volume Discount Tiers */}
              {product.volumeTiers.length > 0 ? (
                <div className="mb-6">
                  <VolumeTierTable
                    basePriceToman={currentVariant.priceToman}
                    volumeTiers={product.volumeTiers}
                    quantity={quantity}
                  />
                </div>
              ) : null}

              {/* Service Badges */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-gray-100 text-[11px] text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <ThermometerSnowflake className="w-4 h-4" />
                  </div>
                  <span>ارسال با زنجیره سرمایش</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span>برش تازه و روزانه</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>تضمین اصالت و مرغوبیت</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs mb-12">
          {/* Tabs Navigation */}
          <div className="flex items-center gap-2 sm:gap-4 border-b border-gray-200 pb-4 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'specs'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>مشخصات محصول</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('desc')}
              className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'desc'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>توضیحات و راهنمای مصرف</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'reviews'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>نظرات خریداران</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-normal">
                {toPersianDigits(product.reviewCount || 24)}
              </span>
            </button>
          </div>

          {/* Tab 1: Specifications */}
          {activeTab === 'specs' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <tbody className="divide-y divide-gray-100">
                  {product.specifications.map((spec, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-bold text-gray-500 w-1/3 sm:w-1/4">
                        {spec.label}
                      </td>
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {spec.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* Tab 2: Description */}
          {activeTab === 'desc' ? (
            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          ) : null}

          {/* Tab 3: Reviews Placeholder */}
          {activeTab === 'reviews' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-amber-500 flex items-center gap-1">
                    <Star className="w-7 h-7 fill-amber-400" />
                    <span>{toPersianDigits(product.rating || 4.8)}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      امتیاز کاربران پروتئین ایرانی
                    </div>
                    <div className="text-xs text-gray-500">
                      بر اساس {toPersianDigits(product.reviewCount || 24)} تجربه خرید ثبت شده
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  ثبت نظر برای این محصول
                </button>
              </div>

              {/* Sample reviews */}
              <div className="divide-y divide-gray-100">
                <div className="py-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-800">
                      محمدرضا ک.
                    </span>
                    <span className="text-[11px] text-gray-400">۲ روز پیش</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    کیفیت ژامبون عالی بود، کاملا تازه و با ضخامت اسلایس یکدست به دستم رسید. بسته‌بندی خنک‌کننده هم داشت.
                  </p>
                </div>
                <div className="py-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-800">
                      فاطمه ر.
                    </span>
                    <span className="text-[11px] text-gray-400">۱ هفته پیش</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    برای دورهمی خرید عمده (بیشتر از ۶ عدد) کردیم، تخفیف پلکانی خیلی خوبی داشت و تحویلش زیر ۱ ساعت بود.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 ? (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900">
                  محصولات مشابه
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  پیشنهاد شده بر اساس سبد خرید و دسته {product.categoryNameFa}
                </p>
              </div>
              <Link
                href={`/products?categoryId=${product.categoryId}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                <span>مشاهده همه</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
  );
}

export default function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const [resolvedSlug, setResolvedSlug] = useState<string>('');

  useEffect(() => {
    let active = true;
    if (params) {
      if (typeof (params as any).then === 'function') {
        (params as Promise<{ slug: string }>).then((res) => {
          if (active && res) {
            setResolvedSlug(res.slug || '');
          }
        });
      } else {
        setResolvedSlug((params as unknown as { slug: string }).slug || '');
      }
    }
    return () => {
      active = false;
    };
  }, [params]);

  if (!resolvedSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center font-vazirmatn text-gray-500">
        در حال بارگذاری اطلاعات محصول...
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-vazirmatn text-gray-500">
          در حال بارگذاری اطلاعات محصول...
        </div>
      }
    >
      <ProductDetailPageContent key={resolvedSlug} slug={resolvedSlug} />
    </Suspense>
  );
}
