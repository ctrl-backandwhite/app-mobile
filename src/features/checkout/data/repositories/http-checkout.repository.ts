import { AppError } from '@core/errors/app-error'
import { HttpClient } from '@core/http/http-client'
import { Result } from '@core/result/result'
import { PlacedOrder } from '@features/checkout/domain/entities/placed-order'
import { CheckoutOrder, CheckoutRepository } from '@features/checkout/domain/ports/checkout-repository'

import { placedOrderDto } from '../dto/checkout.dto'
import { toPlacedOrder } from '../mappers/placed-order.mapper'

import { call } from './http-call'

export class HttpCheckoutRepository implements CheckoutRepository {
  constructor(private readonly http: HttpClient) {}

  /**
   * Crea el pedido.
   *
   * La cabecera `Idempotency-Key` va SIEMPRE. En un móvil la conexión se corta a mitad de la
   * petición: sin ella, el segundo intento crearía un pedido nuevo y cobraría otra vez; con ella el
   * backend reconoce el intento y devuelve el pedido que ya tenía.
   */
  async placeOrder(
    order: CheckoutOrder,
    idempotencyKey: string,
  ): Promise<Result<PlacedOrder, AppError>> {
    return call(
      () =>
        this.http.post(
          '/me/orders/checkout',
          {
            shippingAddressId: order.shippingAddressId,
            items: order.items,
            notes: order.notes,
            paymentMethod: order.paymentMethod,
            couponCode: order.couponCode,
          },
          { headers: { 'Idempotency-Key': idempotencyKey } },
        ),
      (raw) => toPlacedOrder(placedOrderDto.parse(raw)),
      'La respuesta del pedido no tiene el formato esperado.',
    )
  }
}
