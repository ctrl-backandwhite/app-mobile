import { z } from 'zod'

/**
 * Contrato de las respuestas del catálogo, validado en la frontera.
 *
 * Es deliberadamente TOLERANTE: todo lo que el backend puede omitir va como `.optional()` y las
 * listas llevan `.default([])`. Además, `z.object` descarta los campos que no conoce, así que un
 * campo nuevo en la API —o uno que solo interesa al panel de administración— no rompe la
 * aplicación instalada. Lo que sí rompe es que falte un campo imprescindible, y ese fallo se quiere
 * explícito: sale como error `CONTRACT` en la frontera y no como un `undefined` en una pantalla.
 */
export const productSummaryDto = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  mainImage: z.string().optional(),
  rating: z.number().optional(),
  monthlySales: z.number(),
  trendScore: z.number().optional(),
  status: z.string(),
  displayFormatted: z.string().optional(),
  originalFormatted: z.string().optional(),
  discountPercent: z.number().optional(),
  promotionName: z.string().optional(),
})

export const productPageDto = z.object({
  items: z.array(productSummaryDto).default([]),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
})

/**
 * El árbol es recursivo, de ahí el descriptor de acceso: es la forma con la que Zod 4 resuelve una
 * referencia a sí mismo conservando la inferencia de tipos.
 */
export const categoryDto = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  // El backend manda `null` para los nodos raíz, no ausencia de campo.
  parentId: z.string().nullable().optional(),
  position: z.number(),
  icon: z.string().optional(),
  directProductCount: z.number().optional(),
  get children() {
    return z.array(categoryDto).optional()
  },
})

export const categoryTreeDto = z.array(categoryDto)

export const homeSectionDto = z.object({
  // Texto libre a propósito: una sección desconocida debe pintarse, no tumbar la portada.
  code: z.string(),
  title: z.string(),
  items: z.array(productSummaryDto).default([]),
})

export const homeSectionsDto = z.object({
  sections: z.array(homeSectionDto).default([]),
  hotCategories: z.array(categoryDto).default([]),
  totalProducts: z.number(),
})

export const productImageDto = z.object({
  id: z.string(),
  sourceUrl: z.string(),
  cdnUrl: z.string().optional(),
  position: z.number(),
  role: z.string().optional(),
})

/**
 * Del precio de la variante solo se recoge lo ya formateado: `price` también viaja, pero pintarlo
 * exigiría elegir divisa y formato en el cliente, que es justo lo que no se hace aquí.
 */
export const productVariantDto = z.object({
  id: z.string(),
  sku: z.string().optional(),
  title: z.string().optional(),
  priceFormatted: z.string().optional(),
  originalFormatted: z.string().optional(),
  discountPercent: z.number().optional(),
  stock: z.number().default(0),
  imageUrl: z.string().optional(),
  options: z.record(z.string(), z.string()).default({}),
  active: z.boolean().default(true),
  weightGrams: z.number().optional(),
  lengthMm: z.number().optional(),
  widthMm: z.number().optional(),
  heightMm: z.number().optional(),
})

/** El sufijo `Zh` es el texto original del proveedor: sirve de reserva cuando falta la traducción. */
export const variantOptionValueDto = z.object({
  id: z.string(),
  value: z.string().optional(),
  valueZh: z.string().optional(),
  imageUrl: z.string().optional(),
  imageSourceUrl: z.string().optional(),
  position: z.number().default(0),
})

export const variantOptionDto = z.object({
  id: z.string(),
  name: z.string().optional(),
  nameZh: z.string().optional(),
  position: z.number().default(0),
  values: z.array(variantOptionValueDto).default([]),
})

export const priceTierDto = z.object({
  minQty: z.number(),
  maxQty: z.number().optional(),
  unitPriceFormatted: z.string().optional(),
})

export const specificationDto = z.object({
  key: z.string(),
  value: z.string(),
  position: z.number().optional(),
})

export const responsiblePersonDto = z.object({
  name: z.string(),
  addressLine: z.string(),
  postalCode: z.string().optional(),
  city: z.string(),
  region: z.string().optional(),
  country: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  roleLabel: z.string(),
})

export const complianceDto = z.object({
  manufacturerName: z.string().optional(),
  manufacturerAddress: z.string().optional(),
  manufacturerEmail: z.string().optional(),
  manufacturerComplete: z.boolean().default(false),
  safetyWarnings: z.array(z.string()).default([]),
  responsiblePerson: responsiblePersonDto.optional(),
})

/**
 * La ficha comparte con el resumen todo el bloque de precios, así que se extiende en lugar de
 * repetirlo: una regla nueva de promoción se aplica a los dos a la vez.
 *
 * `moq` y `reviewCount` llevan valor por defecto porque su ausencia no debe dejar la ficha entera
 * sin pintar: sin pedido mínimo se compra de uno en uno, y sin recuento no hay opiniones que
 * anunciar.
 */
export const productDetailDto = productSummaryDto.extend({
  description: z.string().optional(),
  brand: z.string().optional(),
  moq: z.number().default(1),
  reviewCount: z.number().default(0),
  videoUrl: z.string().optional(),
  hasVideo: z.boolean().optional(),
  images: z.array(productImageDto).default([]),
  variants: z.array(productVariantDto).default([]),
  variantOptions: z.array(variantOptionDto).default([]),
  priceTiers: z.array(priceTierDto).default([]),
  specifications: z.array(specificationDto).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()).optional(),
  compliance: complianceDto.optional(),
})

export const reviewDto = z.object({
  id: z.string(),
  rating: z.number(),
  title: z.string().optional(),
  body: z.string().optional(),
  authorName: z.string().optional(),
  createdAt: z.string().optional(),
})

/** La respuesta trae además el reparto por estrellas y la media; la ficha aún no los pinta. */
export const reviewPageDto = z.object({
  items: z.array(reviewDto).default([]),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
})

export const relatedProductsDto = z.array(productSummaryDto)

export type ProductSummaryDto = z.infer<typeof productSummaryDto>
export type ProductPageDto = z.infer<typeof productPageDto>
export type CategoryDto = z.infer<typeof categoryDto>
export type HomeSectionDto = z.infer<typeof homeSectionDto>
export type HomeSectionsDto = z.infer<typeof homeSectionsDto>
export type ProductImageDto = z.infer<typeof productImageDto>
export type ProductVariantDto = z.infer<typeof productVariantDto>
export type VariantOptionDto = z.infer<typeof variantOptionDto>
export type ProductDetailDto = z.infer<typeof productDetailDto>
export type ReviewDto = z.infer<typeof reviewDto>
export type ReviewPageDto = z.infer<typeof reviewPageDto>
