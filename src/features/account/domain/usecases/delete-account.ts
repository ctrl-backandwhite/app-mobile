import { AppError } from '@core/errors/app-error'
import { err, Result } from '@core/result/result'

import { AccountRepository } from '../ports/account-repository'

/**
 * Borrar la cuenta desde la propia aplicación.
 *
 * <p>No es una función más: Apple y Google lo exigen para publicar una app que permite registrarse, y
 * mandar a la persona a la web a hacerlo es motivo de rechazo en la revisión.
 *
 * <p>Va en DOS PASOS con un código al correo a propósito. Un botón que borra al primer toque es un
 * accidente esperando a ocurrir —un teléfono desbloqueado en manos ajenas basta—, y el código
 * demuestra además que quien pide el borrado tiene acceso al buzón de la cuenta.
 */
export class RequestAccountDeletion {
  constructor(private readonly repository: AccountRepository) {}

  execute(): Promise<Result<void, AppError>> {
    return this.repository.requestDeletion()
  }
}

export class ConfirmAccountDeletion {
  constructor(private readonly repository: AccountRepository) {}

  async execute(code: string): Promise<Result<void, AppError>> {
    const codigo = code.trim()
    if (codigo.length === 0) {
      return err(new AppError('VALIDATION', 'Escribe el código que te hemos enviado por correo.'))
    }
    return this.repository.confirmDeletion(codigo)
  }
}
