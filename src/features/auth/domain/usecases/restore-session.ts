import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { Session } from '../entities/session'
import { AuthRepository } from '../ports/auth-repository'
import { SessionStorage } from '../ports/session-storage'

export class RestoreSession {
  constructor(
    private readonly repository: AuthRepository,
    private readonly storage: SessionStorage,
  ) {}

  /**
   * Devuelve la sesión completa por el mismo motivo que `SignIn`: quien llama necesita los tokens
   * para dejarlos en memoria.
   *
   * Importante: quien invoque esto debe haber publicado antes los tokens guardados donde el cliente
   * HTTP pueda leerlos. Si no, la petición del perfil saldría sin cabecera de autorización y el
   * backend respondería 401, con lo que una sesión perfectamente válida se descartaría en cada
   * arranque.
   */
  async execute(): Promise<Result<Session | null, AppError>> {
    const stored = await this.storage.load()
    if (!stored) return ok(null)

    const result = await this.repository.currentUser()
    if (!result.ok) {
      // Unos tokens que ya no sirven equivalen a no tener sesión: se descartan y el arranque sigue
      // como invitado en lugar de presentar un error que la persona usuaria no puede resolver.
      await this.storage.clear()
      return ok(null)
    }
    return ok({ ...stored, user: result.value })
  }
}
