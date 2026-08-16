import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { Session } from '../entities/session'
import { AuthRepository } from '../ports/auth-repository'
import { SessionStorage } from '../ports/session-storage'

/**
 * Cierra un acceso social a partir de los tokens que el backend devuelve en el enlace de vuelta.
 *
 * El proveedor solo entrega el par de tokens, no el perfil, así que hay que pedirlo con el token
 * recién emitido antes de dar la sesión por buena: si ese token no vale, no hay sesión que guardar.
 */
export class CompleteSocialLogin {
  constructor(
    private readonly repository: AuthRepository,
    private readonly storage: SessionStorage,
  ) {}

  async execute(accessToken: string, refreshToken: string): Promise<Result<Session, AppError>> {
    if (!accessToken || !refreshToken) {
      return err(new AppError('CONTRACT', 'El acceso no ha devuelto una sesión completa.'))
    }

    const user = await this.repository.currentUser(accessToken)
    if (!user.ok) return user

    await this.storage.save({ accessToken, refreshToken })
    return ok({ accessToken, refreshToken, user: user.value })
  }
}
