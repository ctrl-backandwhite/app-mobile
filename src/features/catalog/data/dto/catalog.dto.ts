import { z } from 'zod'

/*
 * LO QUE FALTA VIAJA DE DOS FORMAS y hay que admitir las dos: el backend a veces omite el campo y a
 * veces lo manda como `null` explícito. `optional()` acepta lo primero pero NO lo segundo, y con un
 * solo nulo la validación entera se cae: la portada de la aplicación decía «No se ha podido cargar el
 * catálogo» porque un producto sin rebaja llegaba con `originalFormatted: null`.
 *
 * Por eso `nullish()` en todo lo que el servidor puede dejar vacío. Los mapeadores traducen ese nulo
 * a ausencia, que es lo único que entiende el dominio.
 */

/**
 * Contrato de las respuestas del catálogo, validado en la frontera.
 *
 * Es deliberadamente TOLERANTE: todo lo que el backend puede omitir va como `.nullish()` y las
 * listas llevan `.default([])`. Además, `z.object` descarta los campos que no conoce, así que un
 * campo nuevo en la API —o uno que solo interesa al panel de administración— no rompe la
 * aplicación instalada. Lo que sí rompe es que falte un campo imprescindible, y ese fallo se quiere
 * explícito: sale como error `CONTRACT` en la frontera y no como un `undefined` en una pantalla.
 */
export const productSummaryDto = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  mainImage: z.string().nullish(),
  rating: z.number().nullish(),
  monthlySales: z.number(),
  /*
   * Lo que la tienda pone de su bolsillo. `nullish` y no obligatorio: son campos que el escaparate
   * web ya usa, pero un producto viejo del catálogo puede venir sin ellos y eso no debe tumbar la
   * validación de toda la página.
   */
  dutyCovered: z.boolean().nullish(),
  shippingCovered: z.boolean().nullish(),
  trendScore: z.number().nullish(),
  status: z.string(),
  displayFormatted: z.string().nullish(),
  // El importe y su divisa, además del texto ya formateado. Hacen falta para meter la línea en la
  // cesta: el backend exige el precio de origen al guardarla, y de un texto como «3,52 €» no se
  // puede sacar un número sin volver a interpretar el formato de ocho idiomas.
  displayPrice: z.number().nullish(),
  displayCurrency: z.string().nullish(),
  originalFormatted: z.string().nullish(),
  discountPercent: z.number().nullish(),
  promotionName: z.string().nullish(),
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
  parentId: z.string().nullish(),
  position: z.number(),
  icon: z.string().nullish(),
  directProductCount: z.number().nullish(),
  get children() {
    return z.array(categoryDto).nullish()
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
  cdnUrl: z.string().nullish(),
  position: z.number(),
  role: z.string().nullish(),
})

/**
 * Del precio de la variante solo se recoge lo ya formateado: `price` también viaja, pero pintarlo
 * exigiría elegir divisa y formato en el cliente, que es justo lo que no se hace aquí.
 */
export const productVariantDto = z.object({
  id: z.string(),
  sku: z.string().nullish(),
  title: z.string().nullish(),
  priceFormatted: z.string().nullish(),
  originalFormatted: z.string().nullish(),
  discountPercent: z.number().nullish(),
  stock: z.number().default(0),
  imageUrl: z.string().nullish(),
  options: z.record(z.string(), z.string()).default({}),
  active: z.boolean().default(true),
  weightGrams: z.number().nullish(),
  lengthMm: z.number().nullish(),
  widthMm: z.number().nullish(),
  heightMm: z.number().nullish(),
})

/**
 * El sufijo `Zh` es el texto original del proveedor: sirve de reserva cuando falta la traducción.
 *
 * <p>`valueLocalized` es la traducción al idioma pedido y es lo PRIMERO que hay que mirar: desde el
 * 25-ago-2026 el backend traduce también las opciones de la variante, y `value` viene vacío en las
 * fichas cargadas desde entonces. Sin este campo el rótulo cae al chino.
 */
export const variantOptionValueDto = z.object({
  id: z.string(),
  value: z.string().nullish(),
  valueLocalized: z.string().nullish(),
  valueZh: z.string().nullish(),
  imageUrl: z.string().nullish(),
  imageSourceUrl: z.string().nullish(),
  position: z.number().default(0),
})

export const variantOptionDto = z.object({
  id: z.string(),
  name: z.string().nullish(),
  nameZh: z.string().nullish(),
  position: z.number().default(0),
  values: z.array(variantOptionValueDto).default([]),
})

export const priceTierDto = z.object({
  minQty: z.number(),
  maxQty: z.number().nullish(),
  unitPriceFormatted: z.string().nullish(),
})

export const specificationDto = z.object({
  key: z.string(),
  value: z.string(),
  position: z.number().nullish(),
})

export const responsiblePersonDto = z.object({
  name: z.string(),
  addressLine: z.string(),
  postalCode: z.string().nullish(),
  city: z.string(),
  region: z.string().nullish(),
  country: z.string(),
  email: z.string(),
  phone: z.string().nullish(),
  roleLabel: z.string(),
})

export const complianceDto = z.object({
  manufacturerName: z.string().nullish(),
  manufacturerAddress: z.string().nullish(),
  manufacturerEmail: z.string().nullish(),
  manufacturerComplete: z.boolean().default(false),
  safetyWarnings: z.array(z.string()).default([]),
  responsiblePerson: responsiblePersonDto.nullish(),
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
  description: z.string().nullish(),
  brand: z.string().nullish(),
  moq: z.number().default(1),
  reviewCount: z.number().default(0),
  videoUrl: z.string().nullish(),
  hasVideo: z.boolean().nullish(),
  images: z.array(productImageDto).default([]),
  variants: z.array(productVariantDto).default([]),
  variantOptions: z.array(variantOptionDto).default([]),
  priceTiers: z.array(priceTierDto).default([]),
  specifications: z.array(specificationDto).nullish(),
  attributes: z.record(z.string(), z.string()).nullish(),
  tags: z.array(z.string()).nullish(),
  compliance: complianceDto.nullish(),
})

export const reviewDto = z.object({
  id: z.string(),
  rating: z.number(),
  title: z.string().nullish(),
  body: z.string().nullish(),
  authorName: z.string().nullish(),
  createdAt: z.string().nullish(),
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
