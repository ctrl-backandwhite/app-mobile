import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { AuthRepository } from '../ports/auth-repository'
import { SessionStorage } from '../ports/session-storage'

export class SignOut {
  constructor(
    private readonly repository: AuthRepository,
    private readonly storage: SessionStorage,
  ) {}

  async execute(): Promise<Result<void, AppError>> {
    await this.repository.signOut()
    // La sesión local se borra pase lo que pase: si la revocación remota falla (401, sin red…),
    // dejar los tokens en el dispositivo sería peor que no revocarlos en el servidor.
    await this.storage.clear()
    return ok(undefined)
  }
}
