import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { PaymentApprovalGateway } from '../ports/payment-approval-gateway'
import {
  ExternalPaymentMethod,
  PaymentIntentRepository,
} from '../ports/payment-intent-repository'

export type ProviderPaymentOutcome = 'paid' | 'cancelled'

/**
 * Cobra un pedido con una pasarela externa (PayPal hoy; el mismo camino sirve para tarjeta nueva).
 *
 * Son tres pasos y el orden importa: se pide el intento de cobro, se manda a la persona a la página
 * del proveedor y, al volver, se confirma contra el backend. **La confirmación no se salta nunca**:
 * que el navegador vuelva con un «aprobado» solo dice que la persona pulsó el botón, no que el
 * dinero haya llegado. Quien decide si el pedido está pagado es el servidor.
 *
 * Cancelar en la pasarela no es un fallo: el pedido queda pendiente y se puede reintentar sin
 * rehacer la cesta.
 */
export class PayWithProvider {
  constructor(
    private readonly payments: PaymentIntentRepository,
    private readonly approval: PaymentApprovalGateway,
  ) {}

  async execute(
    orderId: string,
    method: ExternalPaymentMethod,
  ): Promise<Result<ProviderPaymentOutcome, AppError>> {
    const intent = await this.payments.initiate(orderId, method)
    if (!intent.ok) return intent

    if (!intent.value.approvalUrl) {
      return err(
        new AppError('CONTRACT', 'La pasarela no ha devuelto la página para autorizar el pago.'),
      )
    }

    const outcome = await this.approval.approve(intent.value.approvalUrl)
    if (!outcome.ok) return outcome
    if (outcome.value === 'cancelled') return ok('cancelled')

    const confirmed = await this.payments.confirm(orderId, intent.value.paymentId)
    if (!confirmed.ok) return confirmed

    return ok('paid')
  }
}
