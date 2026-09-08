import { AppError } from '@core/errors/app-error'
import { err, Result } from '@core/result/result'
import { checkPassword } from '@features/auth/domain/policies/password-policy'

import { AccountRepository } from '../ports/account-repository'

export class ChangePassword {
  constructor(private readonly repository: AccountRepository) {}

  async execute(current: string, next: string): Promise<Result<void, AppError>> {
    if (current.length === 0) {
      return err(new AppError('VALIDATION', 'Escribe tu contraseña actual.'))
    }
    // La misma política que en el alta y en la recuperación: si aquí fuera más laxa, cambiar la
    // contraseña sería la manera de saltarse los requisitos del registro.
    if (!checkPassword(next).valid) {
      return err(new AppError('VALIDATION', 'La contraseña nueva no cumple los requisitos.'))
    }
    if (current === next) {
      return err(new AppError('VALIDATION', 'La contraseña nueva tiene que ser distinta.'))
    }
    return this.repository.changePassword(current, next)
  }
}
