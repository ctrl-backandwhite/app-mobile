import { AppError } from '@core/errors/app-error'
import { err, Result } from '@core/result/result'

import { BillingRepository } from '../ports/billing-repository'
import { CardSetupGateway } from '../ports/card-setup-gateway'

const NO_HOLDER = new AppError('VALIDATION', 'Escribe el nombre que aparece en la tarjeta.')

/**
 * Guarda una tarjeta nueva en el perfil.
 *
 * Son dos pasos y el orden importa: primero el backend abre el intento —es quien sabe a qué cliente
 * de la pasarela se ata la tarjeta— y después el SDK lo cierra con los datos tecleados. Al revés no
 * hay forma: sin secreto del intento, la pasarela no acepta nada.
 *
 * El nombre del titular es obligatorio, igual que en el panel web: viaja a la pasarela como dato de
 * facturación y es lo que miran sus controles antifraude.
 */
export class AddCard {
  constructor(
    private readonly billing: BillingRepository,
    private readonly cards: CardSetupGateway,
  ) {}

  async execute(holderName: string): Promise<Result<void, AppError>> {
    const holder = holderName.trim()
    if (!holder) return err(NO_HOLDER)

    const intent = await this.billing.createSetupIntent()
    if (!intent.ok) return intent

    return this.cards.confirmSetup(intent.value, holder)
  }
}
