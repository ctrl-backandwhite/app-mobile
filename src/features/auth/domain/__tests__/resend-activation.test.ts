import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { ResendActivation } from '../usecases/resend-activation'
import { FakeAuthRepository } from '../testing/fake-auth-repository'

/**
 * El doble compartido no guarda el correo del reenvío, así que se anota aquí. El parámetro es
 * opcional porque el método heredado no declara ninguno y añadir uno obligatorio rompería la firma.
 */
class RecordingRepository extends FakeAuthRepository {
  lastEmail: string | null = null

  override async resendActivation(email?: string): Promise<Result<void, AppError>> {
    this.lastEmail = email ?? null
    return super.resendActivation()
  }
}

describe('ResendActivation', () => {
  it('normaliza el correo antes de pedir el reenvío', async () => {
    const repository = new RecordingRepository()
    const resend = new ResendActivation(repository)

    const result = await resend.execute('  Ana@NX036.com ')

    expect(result).toEqual({ ok: true, value: undefined })
    expect(repository.lastEmail).toBe('ana@nx036.com')
  })

  it('propaga el límite de intentos del backend', async () => {
    const repository = new FakeAuthRepository({ error: new AppError('RATE_LIMITED', 'espera') })
    const resend = new ResendActivation(repository)

    const result = await resend.execute('ana@nx036.com')

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.code).toBe('RATE_LIMITED')
  })
})
