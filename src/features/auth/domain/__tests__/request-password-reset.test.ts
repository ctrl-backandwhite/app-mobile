import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { RequestPasswordReset } from '../usecases/request-password-reset'
import { FakeAuthRepository } from '../testing/fake-auth-repository'

/**
 * El doble compartido no guarda el correo de la solicitud, así que se anota aquí. El parámetro es
 * opcional porque el método heredado no declara ninguno y añadir uno obligatorio rompería la firma.
 */
class RecordingRepository extends FakeAuthRepository {
  lastEmail: string | null = null

  override async requestPasswordReset(email?: string): Promise<Result<void, AppError>> {
    this.lastEmail = email ?? null
    return super.requestPasswordReset()
  }
}

describe('RequestPasswordReset', () => {
  it('normaliza el correo y responde igual aunque la cuenta no exista', async () => {
    const repository = new RecordingRepository()
    const request = new RequestPasswordReset(repository)

    const result = await request.execute(' NoExiste@NX036.com ')

    expect(result).toEqual({ ok: true, value: undefined })
    expect(repository.lastEmail).toBe('noexiste@nx036.com')
  })

  it('propaga el fallo de red', async () => {
    const repository = new FakeAuthRepository({ error: new AppError('NETWORK', 'sin conexión') })
    const request = new RequestPasswordReset(repository)

    const result = await request.execute('ana@nx036.com')

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.code).toBe('NETWORK')
  })
})
