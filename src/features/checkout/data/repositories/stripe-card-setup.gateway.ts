import { confirmSetupIntent, ConfirmSetupIntentResult } from '@stripe/stripe-react-native'

import { AppError } from '@core/errors/app-error'
import { logger } from '@core/logger/logger'
import { err, ok, Result } from '@core/result/result'
import { CardSetupGateway } from '@features/checkout/domain/ports/card-setup-gateway'

import { toAppError } from './stripe-error'

const FALLBACK = 'No se ha podido guardar la tarjeta. Revisa los datos e inténtalo de nuevo.'

/**
 * Alta de tarjeta con el SDK nativo de la pasarela.
 *
 * `confirmSetupIntent` no recibe el número de tarjeta: lo toma del formulario del SDK que hay
 * montado en pantalla y lo manda a la pasarela sin pasar por este código ni por el backend. Esa es
 * la razón de que el formulario sea suyo y no un campo de texto propio.
 */
export class StripeCardSetupGateway implements CardSetupGateway {
  async confirmSetup(clientSecret: string, holderName: string): Promise<Result<void, AppError>> {
    let outcome: ConfirmSetupIntentResult
    try {
      outcome = await confirmSetupIntent(clientSecret, {
        paymentMethodType: 'Card',
        // El titular acompaña a la tarjeta como dato de facturación: aparece en el método guardado
        // y es lo que miran los controles antifraude de la pasarela.
        paymentMethodData: { billingDetails: { name: holderName } },
      })
    } catch (error) {
      logger.warn('El SDK de la pasarela no pudo guardar la tarjeta', error)
      return err(new AppError('UNKNOWN', FALLBACK))
    }

    if (outcome.error) return err(toAppError(outcome.error, FALLBACK))
    return ok(undefined)
  }
}
