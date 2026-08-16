import { handleNextAction, HandleNextActionResult } from '@stripe/stripe-react-native'

import { AppError } from '@core/errors/app-error'
import { logger } from '@core/logger/logger'
import { err, ok, Result } from '@core/result/result'
import { CardAuthenticator } from '@features/checkout/domain/ports/card-authenticator'

import { toAppError } from './stripe-error'

const FALLBACK = 'No se ha podido completar la autenticación de tu banco.'

/**
 * 3-D Secure con el SDK nativo de la pasarela.
 *
 * Superar el reto NO es haber pagado, y por eso aquí no se mira el estado del intento: con
 * confirmación en el servidor, la pasarela deja el cobro «pendiente de confirmar» justo después de
 * autenticar. Quien cierra el cobro —y quien decide si el dinero llegó— es el backend, que es a
 * donde va el caso de uso en cuanto esto devuelve bien.
 */
export class StripeCardAuthenticator implements CardAuthenticator {
  async authenticate(clientSecret: string): Promise<Result<void, AppError>> {
    let outcome: HandleNextActionResult
    try {
      outcome = await handleNextAction(clientSecret)
    } catch (error) {
      logger.warn('El SDK de la pasarela no pudo abrir la autenticación del banco', error)
      return err(new AppError('UNKNOWN', FALLBACK))
    }

    // Cancelar o fallar el reto deja el error puesto; en ambos casos el cobro NO se confirma.
    if (outcome.error) return err(toAppError(outcome.error, FALLBACK))
    return ok(undefined)
  }
}
