import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

/** Método que la pasarela necesita conocer para preparar el cobro. */
export type ExternalPaymentMethod = 'CARD' | 'PAYPAL' | 'USDT'

/**
 * Cobro externo iniciado. `approvalUrl` es la página del proveedor a la que hay que enviar a la
 * persona; `paymentId` identifica el intento para confirmarlo cuando vuelva.
 */
export interface PaymentIntent {
  readonly paymentId: string
  readonly approvalUrl?: string
  readonly status: string
}

/**
 * Cobro de un pedido ya creado a través de una pasarela externa.
 *
 * Va aparte de la tramitación porque el pedido nace primero y sin pagar: si el cobro no llega, queda
 * pendiente y se puede reintentar sin volver a montar la cesta.
 */
export interface PaymentIntentRepository {
  initiate(orderId: string, method: ExternalPaymentMethod): Promise<Result<PaymentIntent, AppError>>
  confirm(orderId: string, paymentId: string): Promise<Result<PaymentIntent, AppError>>
}
