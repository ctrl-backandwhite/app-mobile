/**
 * Cotización de portes del destino elegido, tal y como la calcula el backend.
 *
 * Todos los importes llegan YA formateados en la divisa activa. Aquí no se suma, no se convierte y
 * no se redondea: el envío, la aduana, el impuesto y el total salen de esta respuesta o no se
 * pintan. Los únicos números en crudo son céntimos de dólar que sirven para DECIDIR (si hay línea
 * de aduana que enseñar, si el monedero llega), nunca para componer un importe en pantalla.
 */
export interface ShippingQuote {
  /** El transportista no cubre ese país: no hay pedido posible hacia allí. */
  readonly supported: boolean
  readonly countryCode?: string
  readonly carrier?: string
  readonly serviceName?: string
  readonly etaMinDays: number
  readonly etaMaxDays: number
  /** Tasa del impuesto en puntos básicos (2100 = 21 %); solo para la etiqueta «(21 %)». */
  readonly taxRateBps: number
  /** Subtotal de producto en céntimos USD; con esto se compara el saldo del monedero. */
  readonly subtotalUsdCents: number
  /** Recargo de despacho de aduana en céntimos USD: si es cero no hay línea que enseñar. */
  readonly customsHandlingUsdCents: number
  readonly discountCents: number
  readonly subtotalFormatted?: string
  readonly shippingFormatted?: string
  /** Envío SIN el recargo de aduana, para separarlo de «Aranceles UE» en el resumen. */
  readonly shippingBaseFormatted?: string
  readonly customsHandlingFormatted?: string
  readonly taxFormatted?: string
  readonly totalFormatted?: string
  readonly discountFormatted?: string
  /** El valor de los bienes supera el umbral de importación: el total ya lleva el despacho formal. */
  readonly customsThresholdExceeded: boolean
  /** El destino no admite pedidos por encima de su umbral: hay que dividir la cesta. */
  readonly customsBlocked: boolean
  readonly customsLimit?: string
  /** DDP = impuestos incluidos; DDU = los paga quien recibe. */
  readonly taxMode?: string
  readonly couponCode?: string
  readonly couponError?: string
}

/** Estado/provincia de un país. El backend los sirve para los destinos con impuesto por región. */
export interface Region {
  readonly code: string
  readonly name: string
}

/**
 * Si la cotización IMPIDE comprar.
 *
 * Que aún no haya cotización no impide nada: mientras va y viene, la compra sigue su curso y es el
 * backend quien tiene la última palabra. Solo una respuesta recibida puede frenar el pedido.
 */
export function blocksOrder(quote?: ShippingQuote | null): boolean {
  if (!quote) return false
  return !quote.supported || quote.customsBlocked
}

/** Etiqueta «21 %» del impuesto. Es un porcentaje, no un importe: no hay dinero que calcular. */
export function taxRateLabel(quote?: ShippingQuote | null): string | undefined {
  if (!quote || !quote.supported || quote.taxRateBps <= 0) return undefined
  return `${quote.taxRateBps / 100} %`
}

/** «7–15 días» de plazo estimado, o nada si el transportista no lo ha dicho. */
export function etaLabel(quote?: ShippingQuote | null): string | undefined {
  if (!quote || !quote.supported || quote.etaMaxDays <= 0) return undefined
  if (quote.etaMinDays === quote.etaMaxDays) return `${quote.etaMaxDays} días`
  return `${quote.etaMinDays}–${quote.etaMaxDays} días`
}

/** Hay recargo de aduana que enseñar como línea propia del resumen. */
export function hasCustomsLine(quote?: ShippingQuote | null): boolean {
  return quote !== undefined && quote !== null && quote.supported && quote.customsHandlingUsdCents > 0
}

/** Hay descuento aplicado (referido o cupón) que enseñar como línea propia. */
export function hasDiscountLine(quote?: ShippingQuote | null): boolean {
  return quote !== undefined && quote !== null && quote.supported && quote.discountCents > 0
}
