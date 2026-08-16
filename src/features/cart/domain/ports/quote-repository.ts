import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { CartQuote } from '../entities/cart-quote'

/** Lo único que el backend necesita para presupuestar: qué se compra y cuánto. */
export interface QuoteItem {
  readonly productId: string
  readonly variantId?: string
  readonly quantity: number
}

/**
 * Precio vigente de la cesta. Es el ÚNICO sitio del que sale un importe: la línea local no guarda
 * precio, así que lo que se pinta siempre viene de aquí y coincide con lo que se factura.
 */
export interface QuoteRepository {
  quote(items: readonly QuoteItem[]): Promise<Result<CartQuote, AppError>>
}
