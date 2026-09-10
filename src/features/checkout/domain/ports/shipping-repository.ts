import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { CheckoutItem } from '../entities/checkout-draft'
import { Region, ShippingQuote, SupportedCountry } from '../entities/shipping'

/** Lo que hace falta para cotizar: a dónde va, qué lleva y qué cupón se ha tecleado. */
export interface ShippingQuoteQuery {
  readonly country: string
  readonly region?: string
  readonly items: readonly CheckoutItem[]
  readonly couponCode?: string
}

/**
 * Portes, impuestos y total del pedido según el destino.
 *
 * Es la ÚNICA fuente de los importes de la compra: la app no suma el envío al subtotal ni aplica
 * ningún impuesto, porque el margen del canal, la tasa del día y las reglas de aduana solo las
 * conoce el backend.
 */
export interface ShippingRepository {
  quote(query: ShippingQuoteQuery): Promise<Result<ShippingQuote, AppError>>
  regions(country: string): Promise<Result<Region[], AppError>>
  countries(): Promise<Result<SupportedCountry[], AppError>>
}
