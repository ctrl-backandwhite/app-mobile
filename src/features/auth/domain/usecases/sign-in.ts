import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { Credentials } from '../entities/credentials'
import { Session } from '../entities/session'
import { AuthRepository } from '../ports/auth-repository'
import { SessionStorage } from '../ports/session-storage'

export class SignIn {
  constructor(
    private readonly repository: AuthRepository,
    private readonly storage: SessionStorage,
  ) {}

  /**
   * Devuelve la sesión completa, no solo el usuario: quien llama necesita también los tokens para
   * dejarlos en memoria, que es de donde los lee el cliente HTTP en cada petición. Devolver solo el
   * usuario obligaría a releerlos del almacén cifrado justo después de haberlos guardado.
   */
  async execute(credentials: Credentials): Promise<Result<Session, AppError>> {
    const normalized: Credentials = {
      ...credentials,
      email: credentials.email.trim().toLowerCase(),
      otp: credentials.otp?.trim() || undefined,
    }
    const result = await this.repository.signIn(normalized)
    if (!result.ok) return result
    // Los tokens solo se persisten con el acceso ya concedido: un 401 por segundo factor pendiente
    // no debe dejar rastro de sesión en el dispositivo.
    await this.storage.save({
      accessToken: result.value.accessToken,
      refreshToken: result.value.refreshToken,
    })
    return ok(result.value)
  }
}
