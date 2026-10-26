import { MOCK_CATALOG_PRODUCTS, CatalogProduct } from './mockProducts';

export interface ProductVariant {
  id: number;
  nameFa: string;
  weightLabel: string;
  priceToman: number;
  compareAtPriceToman?: number;
  discountPercent?: number;
  stock: number;
  inStock: boolean;
  sku?: string;
}

export interface VolumeTier {
  minQuantity: number;
  discountPercent: number;
  tierLabel?: string;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductDetailData {
  id: number;
  slug: string;
  nameFa: string;
  nameEn?: string;
  brandNameFa: string;
  brandId?: number;
  categoryId: number;
  categoryNameFa: string;
  categorySlug: string;
  descriptionHtml: string;
  images: string[];
  badges?: string[];
  isBestseller?: boolean;
  freshDeliGuarantee?: boolean;
  variants: ProductVariant[];
  volumeTiers: VolumeTier[];
  specifications: ProductSpecification[];
  rating?: number;
  reviewCount?: number;
  totalStock?: number;
  inStock?: boolean;
}

const DETAILED_PRODUCTS: Record<string, Partial<ProductDetailData>> = {
  'andre-turkey-ham-90': {
    id: 101,
    slug: 'andre-turkey-ham-90',
    nameFa: 'ژامبون بوقلمون ۹۰٪ آندره',
    nameEn: 'Andre Turkey Ham 90%',
    brandNameFa: 'آندره',
    categoryId: 2,
    categoryNameFa: 'کالباس و ژامبون',
    categorySlug: 'ham-coldcuts',
    images: [
      '/images/products/turkey-ham.png',
      '/images/products/turkey-ham-slice.png',
      '/images/products/turkey-ham-pack.png',
    ],
    badges: ['پرفروش', 'تخفیف ویژه'],
    isBestseller: true,
    freshDeliGuarantee: true,
    variants: [
      {
        id: 1011,
        nameFa: '۲۵۰ گرم اسلایس',
        weightLabel: '۲۵۰ گرم',
        priceToman: 240000,
        compareAtPriceToman: 320000,
        discountPercent: 25,
        stock: 25,
        inStock: true,
      },
      {
        id: 1012,
        nameFa: '۵۰۰ گرم',
        weightLabel: '۵۰۰ گرم',
        priceToman: 460000,
        compareAtPriceToman: 600000,
        discountPercent: 23,
        stock: 15,
        inStock: true,
      },
      {
        id: 1013,
        nameFa: '۱ کیلوگرم',
        weightLabel: '۱ کیلوگرم',
        priceToman: 890000,
        compareAtPriceToman: 1150000,
        discountPercent: 22,
        stock: 6,
        inStock: true,
      },
    ],
    volumeTiers: [
      {
        minQuantity: 3,
        discountPercent: 10,
        tierLabel: '۳ عدد به بالا: ۱۰٪ تخفیف',
      },
      {
        minQuantity: 6,
        discountPercent: 20,
        tierLabel: '۶ عدد به بالا: ۲۰٪ تخفیف',
      },
    ],
    specifications: [
      { label: 'برند', value: 'آندره' },
      { label: 'ترکیبات', value: '۹۰٪ گوشت فیله بوقلمون، ادویه‌های طبیعی دودی، نمک تصفیه' },
      { label: 'مدت ماندگاری', value: '۳۰ روز در دمای یخچال' },
      { label: 'دمای نگهداری', value: '۱ تا ۴ درجه سانتی‌گراد' },
      { label: 'نوع برش', value: 'اسلایس نازک دلی با دستگاه حرفه‌ای' },
      { label: 'شماره پروانه بهداشت', value: '۱۵/۱۴۲۵۸' },
    ],
    descriptionHtml: `
      <p>ژامبون بوقلمون ۹۰ درصد آندره یکی از پرطرفدارترین محصولات پروتئینی سردخانه دلی است که از فیله خالص سینه بوقلمون با فرآوری ملایم و دودی کم‌نظیر تهیه شده است.</p>
      <p class="mt-2">این محصول با نسبت پروتئین بالا و چربی کمتر از ۳ درصد، انتخابی ایده‌آل برای ورزشکاران، کودکان و علاقه‌مندان به ساندویچ‌های سرد سبک اروپایی محسوب می‌شود.</p>
    `,
    rating: 4.8,
    reviewCount: 38,
    inStock: true,
    totalStock: 46,
  },
  'andre-bulgarian-smoked': {
    id: 301,
    slug: 'andre-bulgarian-smoked',
    nameFa: 'سوسیس بلغاری دودی',
    nameEn: 'Andre Smoked Bulgarian Sausage',
    brandNameFa: 'آندره',
    categoryId: 1,
    categoryNameFa: 'سوسیس و هات‌داگ',
    categorySlug: 'sausage-hotdog',
    images: ['/images/products/sausage-202.png'],
    badges: ['محبوب'],
    isBestseller: false,
    freshDeliGuarantee: true,
    variants: [
      {
        id: 3011,
        nameFa: '۴۰۰ گرم',
        weightLabel: '۴۰۰ گرم',
        priceToman: 190000,
        stock: 0,
        inStock: false,
      },
    ],
    volumeTiers: [
      {
        minQuantity: 3,
        discountPercent: 10,
        tierLabel: '۳ عدد به بالا: ۱۰٪ تخفیف',
      },
    ],
    specifications: [
      { label: 'برند', value: 'آندره' },
      { label: 'مدت ماندگاری', value: '۴۵ روز' },
      { label: 'دمای نگهداری', value: '۱ تا ۴ درجه سانتی‌گراد' },
    ],
    descriptionHtml: '<p>سوسیس بلغاری دودی با گوشت قرمز تازه و چاشنی سیر و پاپریکا دودی.</p>',
    rating: 4.5,
    reviewCount: 12,
    inStock: false,
    totalStock: 0,
  },
};

export function getProductDetailBySlug(slug: string): ProductDetailData | null {
  if (DETAILED_PRODUCTS[slug]) {
    const custom = DETAILED_PRODUCTS[slug];
    const catalogMatch = MOCK_CATALOG_PRODUCTS.find((p) => p.slug === slug);
    return {
      id: custom.id ?? catalogMatch?.id ?? 999,
      slug: slug,
      nameFa: custom.nameFa ?? catalogMatch?.nameFa ?? '',
      nameEn: custom.nameEn ?? catalogMatch?.nameEn,
      brandNameFa: custom.brandNameFa ?? catalogMatch?.brandNameFa ?? 'سبد سبز',
      brandId: custom.brandId ?? catalogMatch?.brandId,
      categoryId: custom.categoryId ?? catalogMatch?.categoryId ?? 1,
      categoryNameFa: custom.categoryNameFa ?? catalogMatch?.categoryNameFa ?? 'پروتئینی',
      categorySlug: custom.categorySlug ?? catalogMatch?.categorySlug ?? 'coldcuts',
      descriptionHtml:
        custom.descriptionHtml ??
        `<p>${custom.nameFa || catalogMatch?.nameFa} با بالاترین استانداردهای بهداشتی و بسته‌بندی در خلاء.</p>`,
      images: custom.images ?? [catalogMatch?.thumbnailUrl || '/images/products/placeholder.png'],
      badges: custom.badges ?? (catalogMatch?.discountPercent ? ['تخفیف ویژه'] : []),
      isBestseller: custom.isBestseller ?? true,
      freshDeliGuarantee: custom.freshDeliGuarantee ?? true,
      variants: custom.variants ?? [
        {
          id: (custom.id ?? 1) * 10 + 1,
          nameFa: catalogMatch?.portionLabel || 'بسته استاندارد',
          weightLabel: catalogMatch?.weightLabel || 'استاندارد',
          priceToman: catalogMatch?.priceToman || 100000,
          compareAtPriceToman: catalogMatch?.compareAtPriceToman ?? undefined,
          discountPercent: catalogMatch?.discountPercent ?? undefined,
          stock: catalogMatch?.totalStock ?? 20,
          inStock: catalogMatch?.inStock ?? true,
        },
      ],
      volumeTiers: custom.volumeTiers ?? [
        { minQuantity: 3, discountPercent: 10, tierLabel: '۳ عدد به بالا: ۱۰٪ تخفیف' },
        { minQuantity: 6, discountPercent: 20, tierLabel: '۶ عدد به بالا: ۲۰٪ تخفیف' },
      ],
      specifications: custom.specifications ?? [
        { label: 'برند', value: catalogMatch?.brandNameFa ?? 'سبد سبز' },
        { label: 'مدت ماندگاری', value: '۳۰ روز در دمای یخچال' },
        { label: 'دمای نگهداری', value: '۱ تا ۴ درجه سانتی‌گراد' },
      ],
      rating: custom.rating ?? 4.7,
      reviewCount: custom.reviewCount ?? 15,
      inStock: custom.inStock ?? catalogMatch?.inStock ?? true,
      totalStock: custom.totalStock ?? catalogMatch?.totalStock ?? 20,
    };
  }

  const catalogMatch = MOCK_CATALOG_PRODUCTS.find((p) => p.slug === slug);
  if (!catalogMatch) {
    return null;
  }

  const basePrice = catalogMatch.priceToman;
  return {
    id: catalogMatch.id,
    slug: catalogMatch.slug,
    nameFa: catalogMatch.nameFa,
    nameEn: catalogMatch.nameEn,
    brandNameFa: catalogMatch.brandNameFa ?? 'سبد سبز',
    brandId: catalogMatch.brandId,
    categoryId: catalogMatch.categoryId ?? 1,
    categoryNameFa: catalogMatch.categoryNameFa ?? 'محصولات',
    categorySlug: catalogMatch.categorySlug ?? 'all',
    descriptionHtml: `<p>${catalogMatch.nameFa} تهیه شده از مواد اولیه درجه یک با تضمین تازگی و کیفیت.</p>`,
    images: [catalogMatch.thumbnailUrl || '/images/products/placeholder.png'],
    badges: catalogMatch.discountPercent ? ['تخفیف ویژه'] : ['تازگی تضمین‌شده'],
    isBestseller: true,
    freshDeliGuarantee: true,
    variants: [
      {
        id: catalogMatch.id * 10 + 1,
        nameFa: catalogMatch.portionLabel || 'بسته استاندارد',
        weightLabel: catalogMatch.weightLabel || 'استاندارد',
        priceToman: basePrice,
        compareAtPriceToman: catalogMatch.compareAtPriceToman ?? undefined,
        discountPercent: catalogMatch.discountPercent ?? undefined,
        stock: catalogMatch.totalStock ?? 25,
        inStock: catalogMatch.inStock ?? true,
      },
      {
        id: catalogMatch.id * 10 + 2,
        nameFa: '۵۰۰ گرم',
        weightLabel: '۵۰۰ گرم',
        priceToman: Math.round(basePrice * 1.9),
        stock: Math.max(0, (catalogMatch.totalStock ?? 25) - 5),
        inStock: catalogMatch.inStock ?? true,
      },
      {
        id: catalogMatch.id * 10 + 3,
        nameFa: '۱ کیلوگرم',
        weightLabel: '۱ کیلوگرم',
        priceToman: Math.round(basePrice * 3.6),
        stock: Math.max(0, (catalogMatch.totalStock ?? 25) - 10),
        inStock: catalogMatch.inStock ?? true,
      },
    ],
    volumeTiers: [
      { minQuantity: 3, discountPercent: 10, tierLabel: '۳ عدد به بالا: ۱۰٪ تخفیف' },
      { minQuantity: 6, discountPercent: 20, tierLabel: '۶ عدد به بالا: ۲۰٪ تخفیف' },
    ],
    specifications: [
      { label: 'برند', value: catalogMatch.brandNameFa ?? 'سبد سبز' },
      { label: 'مدت ماندگاری', value: '۳۰ روز در دمای یخچال' },
      { label: 'دمای نگهداری', value: '۱ تا ۴ درجه سانتی‌گراد' },
    ],
    rating: 4.7,
    reviewCount: 20,
    inStock: catalogMatch.inStock ?? true,
    totalStock: catalogMatch.totalStock ?? 25,
  };
}
