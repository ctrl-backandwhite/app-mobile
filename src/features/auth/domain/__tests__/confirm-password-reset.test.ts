import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { ConfirmPasswordReset } from '../usecases/confirm-password-reset'
import { FakeAuthRepository } from '../testing/fake-auth-repository'

/**
 * El doble compartido descarta los argumentos del cambio de contraseña, así que se anotan aquí. Son
 * opcionales porque el método heredado no declara ninguno y añadir obligatorios rompería la firma.
 */
class RecordingRepository extends FakeAuthRepository {
  calls: { token?: string; newPassword?: string }[] = []

  override async confirmPasswordReset(
    token?: string,
    newPassword?: string,
  ): Promise<Result<void, AppError>> {
    this.calls.push({ token, newPassword })
    return super.confirmPasswordReset()
  }
}

describe('ConfirmPasswordReset', () => {
  it('cambia la contraseña con un código correcto y lo normaliza', async () => {
    const repository = new RecordingRepository()
    const confirm = new ConfirmPasswordReset(repository)

    const result = await confirm.execute('  tok-1 ', 'Secreta1!')

    expect(result).toEqual({ ok: true, value: undefined })
    expect(repository.calls).toEqual([{ token: 'tok-1', newPassword: 'Secreta1!' }])
  })

  it('rechaza un código vacío sin llamar al repositorio', async () => {
    const repository = new RecordingRepository()
    const confirm = new ConfirmPasswordReset(repository)

    const result = await confirm.execute('   ', 'Secreta1!')

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.code).toBe('VALIDATION')
    expect(repository.calls).toEqual([])
  })

  it('rechaza una contraseña que no cumple la política sin llamar al repositorio', async () => {
    const repository = new RecordingRepository()
    const confirm = new ConfirmPasswordReset(repository)

    const result = await confirm.execute('tok-1', 'secreta')

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.code).toBe('VALIDATION')
    expect(repository.calls).toEqual([])
  })

  it('propaga el rechazo del backend cuando el código ya se ha usado', async () => {
    const repository = new FakeAuthRepository({ error: new AppError('VALIDATION', 'código usado') })
    const confirm = new ConfirmPasswordReset(repository)

    const result = await confirm.execute('tok-1', 'Secreta1!')

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.message).toBe('código usado')
  })
})
