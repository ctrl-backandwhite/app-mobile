import { AppError } from '@core/errors/app-error'
import { call } from '@core/http/call'
import { HttpClient } from '@core/http/http-client'
import { Result } from '@core/result/result'
import { PaymentMethod } from '@features/checkout/domain/entities/payment-method'
import {
  PaymentMethodsRepository,
  SavedCardCharge,
} from '@features/checkout/domain/ports/payment-methods-repository'

import { paymentMethodListDto, savedCardChargeDto } from '../dto/checkout.dto'
import { toPaymentMethods, toSavedCardCharge } from '../mappers/payment-method.mapper'

const CONTRACT = 'La respuesta de los métodos de pago no tiene el formato esperado.'

export class HttpPaymentMethodsRepository implements PaymentMethodsRepository {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<Result<PaymentMethod[], AppError>> {
    return call(
      () => this.http.get('/me/payment-methods'),
      (raw) => toPaymentMethods(paymentMethodListDto.parse(raw)),
      CONTRACT,
    )
  }

  /**
   * Cobro con una tarjeta guardada, sin que la persona teclee nada.
   *
   * La clave de idempotencia se compone del pedido y de la tarjeta —igual que en el panel web—: dos
   * intentos de cobrar el mismo pedido con la misma tarjeta son el mismo cobro, no dos.
   */
  async chargeSavedCard(
    orderId: string,
    paymentMethodId: string,
  ): Promise<Result<SavedCardCharge, AppError>> {
    return call(
      () =>
        this.http.post(
          `/me/orders/${encodeURIComponent(orderId)}/pay-saved-card`,
          { paymentMethodId },
          { headers: { 'Idempotency-Key': `savedcard-${orderId}-${paymentMethodId}` } },
        ),
      (raw) => toSavedCardCharge(savedCardChargeDto.parse(raw)),
      CONTRACT,
    )
  }

  async confirmSavedCard(orderId: string, paymentId: string): Promise<Result<void, AppError>> {
    return call(
      () =>
        this.http.post(
          `/me/orders/${encodeURIComponent(orderId)}/pay-saved-card/${encodeURIComponent(paymentId)}/confirm`,
        ),
      () => undefined,
      CONTRACT,
    )
  }
}
