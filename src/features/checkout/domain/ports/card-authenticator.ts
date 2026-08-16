import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

/**
 * Autenticación reforzada de una tarjeta (3-D Secure).
 *
 * NO HAY IMPLEMENTACIÓN todavía: completar un 3-D Secure exige el SDK nativo de la pasarela, que no
 * está entre las dependencias de la aplicación. El puerto existe para que el cobro con tarjeta
 * guardada distinga «cobrado» de «pendiente de autenticar» y para que el día que se añada el SDK
 * solo haya que enchufarlo aquí.
 */
export interface CardAuthenticator {
  authenticate(clientSecret: string): Promise<Result<void, AppError>>
}
