import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

/**
 * Autenticación reforzada de una tarjeta (3-D Secure).
 *
 * Superarla NO significa que el cobro esté hecho: el reto del banco solo acredita a la persona, y
 * el intento de pago queda a la espera de que el servidor lo cierre. Por eso este puerto devuelve
 * `void` y no un «pagado»: quien decide si el dinero llegó es el backend.
 */
export interface CardAuthenticator {
  authenticate(clientSecret: string): Promise<Result<void, AppError>>
}
