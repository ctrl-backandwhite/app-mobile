import { AppError } from '@core/errors/app-error'
import { err, Result } from '@core/result/result'

import { AuthRepository } from '../ports/auth-repository'

export class ActivateAccount {
  constructor(private readonly repository: AuthRepository) {}

  async execute(code: string): Promise<Result<void, AppError>> {
    // El código llega de un enlace o de un pegado manual, así que los espacios sobran siempre.
    const normalized = code.trim()
    if (normalized.length === 0) {
      return err(new AppError('VALIDATION', 'Introduce el código de activación.'))
    }
    return this.repository.activate(normalized)
  }
}
