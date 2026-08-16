import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { CardAuthenticator } from '../ports/card-authenticator'

/**
 * Autenticador de tarjeta de mentira.
 *
 * El de verdad abre el reto del banco con el SDK nativo de la pasarela, que en las pruebas no
 * existe; este doble ejercita la rama del 3-D Secure completo sin salir del dominio.
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
