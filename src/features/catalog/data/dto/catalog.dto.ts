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

export type ProductSummaryDto = z.infer<typeof productSummaryDto>
export type ProductPageDto = z.infer<typeof productPageDto>
export type CategoryDto = z.infer<typeof categoryDto>
export type HomeSectionDto = z.infer<typeof homeSectionDto>
export type HomeSectionsDto = z.infer<typeof homeSectionsDto>
