// Mirrors the Java DTO/request records in api/src/main/java/ir/pws/store (Long/int -> number, Instant -> string).

export type StaffRole = 'OWNER' | 'PRODUCT_MANAGER' | 'ORDER_OPERATOR'
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
export type StockMovementReason = 'INITIAL' | 'MANUAL_ADJUSTMENT' | 'ORDER_PAID' | 'ORDER_CANCELLED'

export interface Page<T> {
  items: T[]
  page: number
  size: number
  total: number
}

// ---- Auth / staff
export interface LoginRequest {
  username: string
  password: string
}
export interface LoginChallenge {
  challenge: string
  mobileMasked: string
}
export interface VerifyRequest {
  challenge: string
  code: string
}
export interface StaffMe {
  id: number
  username: string
  fullName: string
  role: StaffRole
}
export interface StaffDto {
  id: number
  username: string
  fullName: string
  mobile: string
  role: StaffRole
  active: boolean
  version: number
}
export interface CreateStaffRequest {
  username: string
  password: string
  fullName: string
  mobile: string
  role: StaffRole
}
export interface UpdateStaffRequest {
  fullName: string
  mobile: string
  role: StaffRole
  active: boolean
  version: number
}
export interface PasswordRequest {
  password: string
}

// ---- Audit
export interface AuditEntryDto {
  id: number
  staffUsername: string | null
  action: string
  entityType: string
  entityId: number | null
  before: unknown
  after: unknown
  ip: string | null
  createdAt: string
}

// ---- Brands
export interface BrandDto {
  id: number
  nameFa: string
  nameEn: string | null
  slug: string
  logoUrl: string | null
  active: boolean
}
export interface BrandRequest {
  nameFa: string
  nameEn?: string | null
  slug: string
  active: boolean
}

// ---- Categories
export interface CategoryDto {
  id: number
  parentId: number | null
  nameFa: string
  nameEn: string | null
  slug: string
  sortOrder: number
  active: boolean
}
export interface CategoryRequest {
  parentId?: number | null
  nameFa: string
  nameEn?: string | null
  slug: string
  sortOrder: number
  active: boolean
}

// ---- Images
export interface ImageDto {
  id: number
  url: string
  thumbUrl: string
  sortOrder: number
  altFa: string | null
  altEn: string | null
}
export interface ImageAltRequest {
  altFa?: string | null
  altEn?: string | null
}
export interface ImageOrderRequest {
  imageIds: number[]
}

// ---- Variants / tiers
export interface TierDto {
  minQty: number
  unitPrice: number
}
export interface TiersRequest {
  tiers: TierDto[]
}
export interface VariantDto {
  id: number
  version: number
  sku: string
  flavourFa: string | null
  flavourEn: string | null
  sizeLabel: string | null
  weightGrams: number | null
  basePrice: number
  compareAtPrice: number | null
  stockOnHand: number
  lowStockThreshold: number
  active: boolean
  sortOrder: number
  tiers: TierDto[]
}
export interface VariantUpsertRequest {
  sku: string
  flavourFa?: string | null
  flavourEn?: string | null
  sizeLabel?: string | null
  weightGrams?: number | null
  basePrice: number
  compareAtPrice?: number | null
  lowStockThreshold?: number | null
  active?: boolean | null
  sortOrder?: number | null
  initialStock?: number | null
  version?: number | null
}

// ---- Products
export interface ProductSummaryDto {
  id: number
  nameFa: string
  nameEn: string | null
  slug: string
  status: ProductStatus
  brandId: number
  categoryId: number
  thumbnailUrl: string | null
  variantCount: number
  minPrice: number | null
  totalStock: number
  updatedAt: string
}
export interface ProductDetailDto {
  id: number
  version: number
  brandId: number
  categoryId: number
  slug: string
  nameFa: string
  nameEn: string | null
  descriptionFa: string | null
  descriptionEn: string | null
  status: ProductStatus
  featured: boolean
  seoTitleFa: string | null
  seoTitleEn: string | null
  seoDescriptionFa: string | null
  seoDescriptionEn: string | null
  images: ImageDto[]
  variants: VariantDto[]
}
export interface ProductUpsertRequest {
  brandId: number
  categoryId: number
  slug: string
  nameFa: string
  nameEn?: string | null
  descriptionFa?: string | null
  descriptionEn?: string | null
  featured: boolean
  seoTitleFa?: string | null
  seoTitleEn?: string | null
  seoDescriptionFa?: string | null
  seoDescriptionEn?: string | null
  version?: number | null
}
export interface ProductStatusRequest {
  status: ProductStatus
  version?: number | null
}

// ---- Inventory
export interface InventoryRowDto {
  variantId: number
  productId: number
  productNameFa: string
  productNameEn: string | null
  sku: string
  flavourFa: string | null
  flavourEn: string | null
  sizeLabel: string | null
  stockOnHand: number
  lowStockThreshold: number
  active: boolean
}
export interface StockMovementDto {
  id: number
  delta: number
  reason: StockMovementReason
  note: string | null
  staffUsername: string | null
  createdAt: string
}
export interface AdjustmentItem {
  variantId: number
  delta: number
  note?: string | null
}
export interface AdjustmentRequest {
  adjustments: AdjustmentItem[]
}

// ---- Errors (problem+json)
export interface FieldError {
  field: string
  code: string
  message: string
}
export interface ProblemDetail {
  code: string
  messages: { fa: string; en: string }
  requestId?: string
  errors?: FieldError[]
}
