import { AppError } from '@core/errors/app-error'
import { err, Result } from '@core/result/result'

import { checkPassword } from '../policies/password-policy'
import { AuthRepository } from '../ports/auth-repository'

export class ConfirmPasswordReset {
  constructor(private readonly repository: AuthRepository) {}

  async execute(token: string, newPassword: string): Promise<Result<void, AppError>> {
    const normalized = token.trim()
    if (normalized.length === 0) {
      return err(new AppError('VALIDATION', 'Introduce el código de recuperación.'))
    }
    // Misma política que en el alta: la contraseña se valida antes de quemar el código de un solo uso.
    if (!checkPassword(newPassword).valid) {
      return err(new AppError('VALIDATION', 'La contraseña no cumple los requisitos de seguridad.'))
    }
    return this.repository.confirmPasswordReset(normalized, newPassword)
  }
}
