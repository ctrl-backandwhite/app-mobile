import { AppError } from '@core/errors/app-error'

/**
 * La forma del fallo que devuelve el SDK de la pasarela.
 *
 * Se declara aquí en lugar de importar `StripeError<T>` porque cada operación lo parametriza con su
 * propio enumerado de códigos y este módulo solo necesita los tres campos comunes.
 */
export interface StripeFailure {
  readonly code: string
  readonly message: string
  readonly localizedMessage?: string
}

/** El SDK usa este código cuando la persona cierra el reto del banco sin completarlo. */
const CANCELLED = 'Canceled'

/**
 * Traduce el fallo del SDK al error con el que razona la aplicación.
 *
 * Cancelar no es un fallo del sistema y por eso tiene código propio: el pedido sigue vivo y se puede
 * reintentar sin rehacer nada. El resto se trata como rechazo de la tarjeta —que es lo que casi
 * siempre es— y se enseña el texto que la pasarela ya trae traducido al idioma del dispositivo.
 */
export function toAppError(failure: StripeFailure, fallbackMessage: string): AppError {
  const message = failure.localizedMessage ?? failure.message
  if (failure.code === CANCELLED) {
    return new AppError('CANCELLED', message || 'Has cancelado la autenticación.')
  }
  return new AppError('VALIDATION', message || fallbackMessage)
}
