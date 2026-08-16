/**
 * Presupuesto de la cesta calculado por el backend.
 *
 * Todos los importes llegan YA formateados en la divisa activa; aquí no se suma, no se convierte y
 * no se redondea nada. Es la única fuente del precio que se enseña, y coincide con el que se cobra.
 */
export interface QuoteLine {
  readonly productId: string
  readonly variantId?: string
  readonly unitFormatted?: string
  readonly lineTotalFormatted?: string
}

export interface CartQuote {
  readonly currency: string
  readonly symbol: string
  readonly items: readonly QuoteLine[]
  readonly subtotalFormatted?: string
}
