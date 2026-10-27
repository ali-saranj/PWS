export interface ProductSummary {
  id: number;
  slug: string;
  nameFa: string;
  nameEn?: string;
  brandId: number;
  brandNameFa: string;
  brandNameEn?: string;
  categoryId: number;
  categoryNameFa: string;
  categoryNameEn?: string;
  thumbnailUrl?: string;
  basePriceRials: number;
  priceToman: number;
  compareAtPriceRials?: number;
  compareAtPriceToman?: number;
  discountPercent?: number;
  inStock: boolean;
  totalStock: number;
  featured?: boolean;
  badges: string[];
  defaultVariantId?: number;
}

export interface VolumeTier {
  minQty: number;
  unitPriceRials?: number;
  unitPriceToman: number;
  discountPercent: number;
}

export interface StorefrontVariant {
  id: number;
  sku: string;
  flavourFa?: string;
  flavourEn?: string;
  sizeLabel?: string;
  weightGrams?: number;
  basePriceRials?: number;
  priceToman: number;
  compareAtPriceRials?: number;
  compareAtPriceToman?: number;
  discountPercent?: number;
  stockOnHand: number;
  inStock: boolean;
  sortOrder?: number;
  tiers: VolumeTier[];
}

export interface StorefrontImage {
  id: number;
  url: string;
  thumbUrl?: string;
  sortOrder: number;
  altFa?: string;
  altEn?: string;
}

export interface CategoryBreadcrumb {
  id: number;
  nameFa: string;
  nameEn?: string;
  slug: string;
}

export interface ProductDetail extends ProductSummary {
  descriptionFa?: string;
  descriptionEn?: string;
  breadcrumb: CategoryBreadcrumb[];
  images: StorefrontImage[];
  variants: StorefrontVariant[];
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface CategoryItem {
  id: number;
  nameFa: string;
  nameEn?: string;
  slug: string;
  descriptionFa?: string;
  icon?: string;
  parentId?: number;
  sortOrder?: number;
}

export interface BrandItem {
  id: number;
  nameFa: string;
  nameEn?: string;
  slug: string;
}

const API_BASE_URL =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function normalizePageResult<T>(data: any, fallbackPage = 0, fallbackSize = 24): PageResult<T> {
  if (!data) {
    return { content: [], totalElements: 0, totalPages: 0, page: fallbackPage, size: fallbackSize };
  }
  const content: T[] = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.content)
    ? data.content
    : [];
  const total = Number(data.total ?? data.totalElements ?? content.length);
  const size = Number(data.size || fallbackSize);
  const page = Number(data.page ?? fallbackPage);
  const totalPages = Number(data.totalPages ?? (size > 0 ? Math.ceil(total / size) : 1));

  return {
    content,
    totalElements: total,
    totalPages,
    page,
    size,
  };
}

export async function fetchCatalogProducts(params: {
  categoryId?: number;
  categorySlug?: string;
  brandId?: number;
  brandSlug?: string;
  brandIds?: number[];
  inStock?: boolean;
  onSale?: boolean;
  minPriceRials?: number;
  maxPriceRials?: number;
  sort?: string;
  page?: number;
  size?: number;
}): Promise<PageResult<ProductSummary>> {
  const query = new URLSearchParams();
  if (params.categoryId !== undefined && params.categoryId !== null && !Number.isNaN(params.categoryId)) {
    query.set('categoryId', String(params.categoryId));
  }
  if (params.categorySlug) {
    query.set('categorySlug', params.categorySlug);
  }
  if (params.brandId !== undefined && params.brandId !== null && !Number.isNaN(params.brandId)) {
    query.set('brandId', String(params.brandId));
  }
  if (params.brandSlug) {
    query.set('brandSlug', params.brandSlug);
  }
  if (Array.isArray(params.brandIds) && params.brandIds.length > 0) {
    const safeBrandIds = params.brandIds.filter(
      (id) => id !== undefined && id !== null && !Number.isNaN(id)
    );
    if (safeBrandIds.length > 0) {
      query.set('brandIds', safeBrandIds.join(','));
    }
  }
  if (params.inStock) {
    query.set('inStock', 'true');
  }
  if (params.onSale) {
    query.set('onSale', 'true');
  }
  if (params.minPriceRials !== undefined && params.minPriceRials !== null && !Number.isNaN(params.minPriceRials)) {
    query.set('minPrice', String(params.minPriceRials));
  }
  if (params.maxPriceRials !== undefined && params.maxPriceRials !== null && !Number.isNaN(params.maxPriceRials)) {
    query.set('maxPrice', String(params.maxPriceRials));
  }
  if (params.sort) {
    query.set('sort', params.sort);
  }
  if (params.page !== undefined && params.page !== null && !Number.isNaN(params.page)) {
    query.set('page', String(params.page));
  }
  if (params.size !== undefined && params.size !== null && !Number.isNaN(params.size)) {
    query.set('size', String(params.size));
  }

  const qs = query.toString();
  const url = `${API_BASE_URL}/api/shop/catalog/products${qs ? `?${qs}` : ''}`;
  const targetPage = params.page !== undefined && !Number.isNaN(params.page) ? params.page : 0;
  const targetSize = params.size !== undefined && !Number.isNaN(params.size) ? params.size : 24;

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return { content: [], totalElements: 0, totalPages: 0, page: targetPage, size: targetSize };
    }
    const data = await res.json();
    return normalizePageResult<ProductSummary>(data, targetPage, targetSize);
  } catch (err) {
    return { content: [], totalElements: 0, totalPages: 0, page: targetPage, size: targetSize };
  }
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetail | null> {
  const url = `${API_BASE_URL}/api/shop/catalog/products/${encodeURIComponent(slug)}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
    });
    if (res.status === 404 || !res.ok) {
      return null;
    }
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function fetchCatalogSearch(
  q: string,
  page: number = 0,
  size: number = 24
): Promise<PageResult<ProductSummary>> {
  const query = new URLSearchParams({
    q: q || '',
    page: String(page),
    size: String(size),
  });

  const url = `${API_BASE_URL}/api/shop/catalog/search?${query.toString()}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return { content: [], totalElements: 0, totalPages: 0, page, size };
    }
    const data = await res.json();
    return normalizePageResult<ProductSummary>(data, page, size);
  } catch (err) {
    return { content: [], totalElements: 0, totalPages: 0, page, size };
  }
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  const url = `${API_BASE_URL}/api/shop/catalog/home`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.categories || [];
  } catch (err) {
    return [];
  }
}

export async function fetchBrands(): Promise<BrandItem[]> {
  const url = `${API_BASE_URL}/api/shop/catalog/brands`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    return [];
  } catch (err) {
    return [];
  }
}
