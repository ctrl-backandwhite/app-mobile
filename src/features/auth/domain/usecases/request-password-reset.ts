import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { AuthRepository } from '../ports/auth-repository'

export class RequestPasswordReset {
  constructor(private readonly repository: AuthRepository) {}

  /** Neutro como el reenvío de activación: la enumeración de cuentas se evita en el backend. */
  async execute(email: string): Promise<Result<void, AppError>> {
    return this.repository.requestPasswordReset(email.trim().toLowerCase())
  }
}
