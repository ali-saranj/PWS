import type { ProductDetailDto, ProductUpsertRequest } from '../../api/types'

export const NAME_MAX = 200
export const SEO_TITLE_MAX = 70
export const SEO_DESCRIPTION_MAX = 160

export interface ProductFormValues {
  brandId: number | ''
  categoryId: number | ''
  slug: string
  nameFa: string
  nameEn: string
  descriptionFa: string
  descriptionEn: string
  featured: boolean
  seoTitleFa: string
  seoTitleEn: string
  seoDescriptionFa: string
  seoDescriptionEn: string
}

export const FORM_FIELDS: readonly string[] = [
  'brandId', 'categoryId', 'slug', 'nameFa', 'nameEn', 'descriptionFa', 'descriptionEn', 'featured',
  'seoTitleFa', 'seoTitleEn', 'seoDescriptionFa', 'seoDescriptionEn',
]
export const SEO_FIELDS: readonly string[] = ['seoTitleFa', 'seoTitleEn', 'seoDescriptionFa', 'seoDescriptionEn']

export const EMPTY_FORM: ProductFormValues = {
  brandId: '', categoryId: '', slug: '', nameFa: '', nameEn: '', descriptionFa: '', descriptionEn: '',
  featured: false, seoTitleFa: '', seoTitleEn: '', seoDescriptionFa: '', seoDescriptionEn: '',
}

export function toFormValues(d: ProductDetailDto | null): ProductFormValues {
  if (!d) return EMPTY_FORM
  return {
    brandId: d.brandId,
    categoryId: d.categoryId,
    slug: d.slug,
    nameFa: d.nameFa,
    nameEn: d.nameEn ?? '',
    descriptionFa: d.descriptionFa ?? '',
    descriptionEn: d.descriptionEn ?? '',
    featured: d.featured,
    seoTitleFa: d.seoTitleFa ?? '',
    seoTitleEn: d.seoTitleEn ?? '',
    seoDescriptionFa: d.seoDescriptionFa ?? '',
    seoDescriptionEn: d.seoDescriptionEn ?? '',
  }
}

const orNull = (s: string): string | null => (s.trim() === '' ? null : s.trim())

/** `version` is only sent when updating. */
export function toRequest(v: ProductFormValues, version?: number): ProductUpsertRequest {
  return {
    brandId: Number(v.brandId),
    categoryId: Number(v.categoryId),
    slug: v.slug,
    nameFa: v.nameFa.trim(),
    nameEn: orNull(v.nameEn),
    descriptionFa: orNull(v.descriptionFa),
    descriptionEn: orNull(v.descriptionEn),
    featured: v.featured,
    seoTitleFa: orNull(v.seoTitleFa),
    seoTitleEn: orNull(v.seoTitleEn),
    seoDescriptionFa: orNull(v.seoDescriptionFa),
    seoDescriptionEn: orNull(v.seoDescriptionEn),
    ...(version !== undefined ? { version } : {}),
  }
}
