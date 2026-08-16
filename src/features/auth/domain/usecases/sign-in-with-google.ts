import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { Session } from '../entities/session'
import { SessionStorage } from '../ports/session-storage'
import { SocialAuthGateway } from '../ports/social-auth-gateway'

export class SignInWithGoogle {
  constructor(
    private readonly gateway: SocialAuthGateway,
    private readonly storage: SessionStorage,
  ) {}

  /**
   * Devuelve la sesión completa, igual que el acceso con contraseña, para que la pantalla pueda
   * publicar los tokens en memoria sin releerlos del almacén cifrado.
   */
  async execute(): Promise<Result<Session, AppError>> {
    const result = await this.gateway.signInWithGoogle()
    if (!result.ok) return result

    // Los tokens solo se persisten con el acceso ya concedido: un flujo cancelado o rechazado no debe
    // dejar rastro de sesión en el dispositivo.
    await this.storage.save({
      accessToken: result.value.accessToken,
      refreshToken: result.value.refreshToken,
    })
    return ok(result.value)
  }
}
