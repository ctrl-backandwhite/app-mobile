import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { CardAuthenticator } from '../ports/card-authenticator'

/**
 * Autenticador de tarjeta de mentira.
 *
 * En producción todavía no hay ninguno —falta el SDK nativo de la pasarela—, así que este doble es
 * lo único que ejercita la rama del 3-D Secure completo del cobro con tarjeta guardada.
 */
export class FakeCardAuthenticator implements CardAuthenticator {
  secrets: string[] = []

  constructor(private readonly error?: AppError) {}

  async authenticate(clientSecret: string): Promise<Result<void, AppError>> {
    this.secrets.push(clientSecret)
    if (this.error) return err(this.error)
    return ok(undefined)
  }
}
