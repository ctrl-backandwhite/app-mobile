import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { CheckoutItem } from '../entities/checkout-draft'
import { ShippingQuote } from '../entities/shipping'
import { ShippingRepository } from '../ports/shipping-repository'

export interface QuoteShippingCommand {
  readonly country?: string
  readonly region?: string
  readonly items: readonly CheckoutItem[]
  readonly couponCode?: string
}

export class QuoteShipping {
  constructor(private readonly shipping: ShippingRepository) {}

  /**
   * Portes, impuestos y total del destino elegido.
   *
   * Sin país o sin líneas devuelve `null` sin llamar: no hay nada que cotizar y la petición dejaría
   * el resumen en «cargando» para acabar sin importes igualmente.
   */
  async execute(command: QuoteShippingCommand): Promise<Result<ShippingQuote | null, AppError>> {
    const country = command.country?.trim()
    if (!country || command.items.length === 0) return ok(null)

    return this.shipping.quote({
      country,
      region: command.region,
      items: command.items,
      couponCode: command.couponCode,
    })
  }
}
