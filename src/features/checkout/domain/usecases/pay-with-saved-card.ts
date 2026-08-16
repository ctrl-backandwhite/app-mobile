import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { CardAuthenticator } from '../ports/card-authenticator'
import { PaymentMethodsRepository } from '../ports/payment-methods-repository'

/**
 * Cómo acabó el cobro con tarjeta guardada.
 *
 * `needs-authentication` NO es un fallo: el pedido existe y el cobro está a la espera de que el
 * banco autentique a la persona. La cesta no se toca hasta que el dinero se mueve de verdad.
 */
export type SavedCardOutcome =
  | { readonly status: 'paid' }
  | { readonly status: 'needs-authentication'; readonly clientSecret?: string }

const MISSING_SECRET = new AppError(
  'CONTRACT',
  'El banco pide autenticación pero el servidor no ha enviado con qué completarla.',
)

export class PayWithSavedCard {
  constructor(
    private readonly payments: PaymentMethodsRepository,
    /**
     * Opcional a propósito: si algún día se monta este caso de uso sin autenticador, el cobro que
     * exige 3-D Secure se devuelve como pendiente en vez de fingir que se ha cobrado.
     */
    private readonly authenticator?: CardAuthenticator,
  ) {}

  /**
   * Cobra un pedido YA CREADO con una tarjeta del perfil.
   *
   * El orden es el mismo que en el panel web y no es negociable: primero se crea el pedido, después
   * se cobra contra su identificador y solo al final, si hubo autenticación, se confirma del lado
   * del servidor. Cobrar antes de tener pedido dejaría dinero movido sin nada a lo que imputarlo.
   */
  async execute(orderId: string, paymentMethodId: string): Promise<Result<SavedCardOutcome, AppError>> {
    const charge = await this.payments.chargeSavedCard(orderId, paymentMethodId)
    if (!charge.ok) return charge
    if (charge.value.status === 'succeeded') return ok({ status: 'paid' })

    const { clientSecret, paymentId } = charge.value
    if (!this.authenticator) return ok({ status: 'needs-authentication', clientSecret })
    if (!clientSecret) return err(MISSING_SECRET)

    const authenticated = await this.authenticator.authenticate(clientSecret)
    if (!authenticated.ok) return authenticated
    if (!paymentId) return err(MISSING_SECRET)

    const confirmed = await this.payments.confirmSavedCard(orderId, paymentId)
    if (!confirmed.ok) return confirmed
    return ok({ status: 'paid' })
  }
}
