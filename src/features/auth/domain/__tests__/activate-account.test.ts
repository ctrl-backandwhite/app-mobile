import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { ActivateAccount } from '../usecases/activate-account'
import { FakeAuthRepository } from '../testing/fake-auth-repository'

/**
 * El doble compartido no guarda el código, así que se anota aquí. El parámetro es opcional porque el
 * método heredado no declara ninguno y añadir uno obligatorio rompería la firma.
 */
class RecordingRepository extends FakeAuthRepository {
  codes: (string | undefined)[] = []

  override async activate(code?: string): Promise<Result<void, AppError>> {
    this.codes.push(code)
    return super.activate()
  }
}

describe('ActivateAccount', () => {
  it('activa la cuenta con un código correcto y lo normaliza', async () => {
    const repository = new RecordingRepository()
    const activate = new ActivateAccount(repository)

    const result = await activate.execute('  ABC123  ')

    expect(result).toEqual({ ok: true, value: undefined })
    expect(repository.codes).toEqual(['ABC123'])
  })

  it('rechaza un código vacío sin llamar al repositorio', async () => {
    const repository = new RecordingRepository()
    const activate = new ActivateAccount(repository)

    const result = await activate.execute('   ')

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.code).toBe('VALIDATION')
    expect(repository.codes).toEqual([])
  })

  it('propaga el error cuando el código ha caducado', async () => {
    const repository = new FakeAuthRepository({ error: new AppError('VALIDATION', 'caducado') })
    const activate = new ActivateAccount(repository)

    const result = await activate.execute('ABC123')

    expect(result.ok === false && result.error.message).toBe('caducado')
  })
})
