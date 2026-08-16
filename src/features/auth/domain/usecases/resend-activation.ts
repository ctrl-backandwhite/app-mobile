import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { AuthRepository } from '../ports/auth-repository'

export class ResendActivation {
  constructor(private readonly repository: AuthRepository) {}

  /** La respuesta del backend es neutra por diseño: no revela si la cuenta existe. */
  async execute(email: string): Promise<Result<void, AppError>> {
    return this.repository.resendActivation(email.trim().toLowerCase())
  }
}
