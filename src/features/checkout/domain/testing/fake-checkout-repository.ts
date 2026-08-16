import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { PlacedOrder } from '../entities/placed-order'
import { CheckoutOrder, CheckoutRepository } from '../ports/checkout-repository'

import { aPlacedOrder } from './checkout-builders'

interface Config {
  order?: PlacedOrder
  error?: AppError
}

/** Tramitación en memoria. Guarda las claves de idempotencia para poder compararlas entre intentos. */
export class FakeCheckoutRepository implements CheckoutRepository {
  calls = 0
  lastOrder: CheckoutOrder | null = null
  keys: string[] = []

  constructor(private readonly config: Config = {}) {}

  async placeOrder(
    order: CheckoutOrder,
    idempotencyKey: string,
  ): Promise<Result<PlacedOrder, AppError>> {
    this.calls += 1
    this.lastOrder = order
    this.keys.push(idempotencyKey)
    if (this.config.error) return err(this.config.error)
    return ok(this.config.order ?? aPlacedOrder())
  }
}
