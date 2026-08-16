import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { PaymentMethod } from '../entities/payment-method'

/**
 * Resultado de cobrar con una tarjeta guardada.
 *
 * `requires_action` significa que el banco exige autenticación reforzada: el cobro NO ha ocurrido y
 * queda a la espera de que alguien complete el 3-D Secure con el secreto del intento.
 */
export interface SavedCardCharge {
  readonly status: 'succeeded' | 'requires_action'
  readonly clientSecret?: string
  readonly paymentId?: string
}

export interface PaymentMethodsRepository {
  list(): Promise<Result<PaymentMethod[], AppError>>
  /** Cobra un pedido ya creado con una tarjeta del perfil, sin que la persona teclee nada. */
  chargeSavedCard(orderId: string, paymentMethodId: string): Promise<Result<SavedCardCharge, AppError>>
  /** Cierra el cobro del lado del servidor una vez superada la autenticación del banco. */
  confirmSavedCard(orderId: string, paymentId: string): Promise<Result<void, AppError>>
}
