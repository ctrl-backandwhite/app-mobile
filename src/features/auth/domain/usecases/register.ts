import { AppError } from '@core/errors/app-error'
import { err, Result } from '@core/result/result'

import { RegisterInput } from '../entities/credentials'
import { checkPassword } from '../policies/password-policy'
import { AuthRepository } from '../ports/auth-repository'

export class Register {
  constructor(private readonly repository: AuthRepository) {}

  async execute(input: RegisterInput): Promise<Result<string, AppError>> {
    // La política se comprueba antes de salir a la red: el backend rechazaría igual, pero gastar una
    // llamada (y un CAPTCHA) para saber lo que ya se sabe empeora la experiencia.
    if (!checkPassword(input.password).valid) {
      return err(new AppError('VALIDATION', 'La contraseña no cumple los requisitos de seguridad.'))
    }
    return this.repository.register({ ...input, email: input.email.trim().toLowerCase() })
  }
}
