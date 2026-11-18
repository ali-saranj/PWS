export const BRAND = {
  nameFa: 'پروتئین ایرانی',
  nameEn: 'Protein Irany',
  titleFa: 'پروتئین ایرانی - فروشگاه تخصصی فرآورده‌های پروتئینی',
  sloganFa: 'سوسیس، کالباس، ترشیجات و محصولات تازه پروتئینی',
  domain: 'https://proteinirany.ir',
  supportEmail: 'support@proteinirany.ir',
  cartStorageKey: 'protein-irany-cart',
  legacyCartStorageKey: 'sabad-sabz-cart',
} as const;

export type BrandConfig = typeof BRAND;
