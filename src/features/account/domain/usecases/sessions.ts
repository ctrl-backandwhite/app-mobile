import { AppError } from '@core/errors/app-error'
import { err, Result } from '@core/result/result'

import { ActiveSession } from '../entities/active-session'
import { AccountRepository } from '../ports/account-repository'

/** Las sesiones abiertas de la cuenta. */
export class ListSessions {
  constructor(private readonly repository: AccountRepository) {}

  execute(): Promise<Result<ActiveSession[], AppError>> {
    return this.repository.sessions()
  }
}

export class RevokeSession {
  constructor(private readonly repository: AccountRepository) {}

  async execute(id: string): Promise<Result<void, AppError>> {
    const identificador = id.trim()
    if (identificador.length === 0) {
      return err(new AppError('VALIDATION', 'No se sabe qué sesión cerrar.'))
    }
    return this.repository.revokeSession(identificador)
  }
}
