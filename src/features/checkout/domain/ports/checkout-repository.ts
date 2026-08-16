import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { CheckoutItem } from '../entities/checkout-draft'
import { PaymentKind } from '../entities/payment-method'
import { PlacedOrder } from '../entities/placed-order'

/** El pedido tal y como se le pide al backend. Ningún importe: los calcula él a partir de esto. */
export interface CheckoutOrder {
  readonly items: readonly CheckoutItem[]
  readonly shippingAddressId: string
  readonly paymentMethod: PaymentKind
  readonly notes?: string
  readonly couponCode?: string
}

export interface CheckoutRepository {
  /**
   * Crea el pedido. La clave de idempotencia NO es opcional: sin ella, un reintento tras un corte de
   * conexión crea un segundo pedido y cobra dos veces.
   */
  placeOrder(order: CheckoutOrder, idempotencyKey: string): Promise<Result<PlacedOrder, AppError>>
}
