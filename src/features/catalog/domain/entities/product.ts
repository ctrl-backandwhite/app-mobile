/**
 * Producto tal y como lo necesita un listado o una portada.
 *
 * PRECIOS: el cálculo (coste, margen por canal, IVA, envío, conversión de divisa) y también el
 * formateo son responsabilidad EXCLUSIVA del backend, que devuelve el importe ya listo para pintar
 * en `displayFormatted`. Por eso esta entidad no tiene ningún campo numérico de precio y la
 * aplicación no hace ninguna operación aritmética con importes: repetir aquí el cálculo produciría
 * cifras distintas de las del carrito en cuanto cambie una regla de margen o una tasa de cambio, y
 * el usuario vería un precio en el catálogo y otro al pagar.
 */
export interface ProductSummary {
  readonly id: string
  readonly slug: string
  readonly title: string
  readonly mainImage?: string
  readonly rating?: number
  readonly monthlySales: number
  readonly trendScore?: number
  readonly status: string
  /** Precio final ya formateado por el backend, con el descuento aplicado si lo hay. */
  readonly displayFormatted?: string
  /** El mismo precio como número y su divisa: es lo que la cesta manda al servidor. */
  readonly displayPrice?: number
  readonly displayCurrency?: string
  /** Precio ANTERIOR (el tachado). Solo llega cuando el producto está en promoción. */
  readonly originalFormatted?: string
  readonly discountPercent?: number
  readonly promotionName?: string
}

/**
 * Solo se pintan dos precios cuando el backend manda los dos datos de la rebaja: con el precio
 * anterior pero sin porcentaje —o al revés— el tachado queda incoherente, así que no se muestra.
 */
export function hasDiscount(product: ProductSummary): boolean {
  return Boolean(product.originalFormatted) && (product.discountPercent ?? 0) > 0
}
