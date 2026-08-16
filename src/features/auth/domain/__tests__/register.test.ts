import { AppError } from '@core/errors/app-error'

import { RegisterInput } from '../entities/credentials'
import { Register } from '../usecases/register'
import { FakeAuthRepository } from '../testing/fake-auth-repository'

function anInput(overrides: Partial<RegisterInput> = {}): RegisterInput {
  return {
    email: 'ana@nx036.com',
    password: 'Secreta1!',
    acceptedTerms: true,
    ...overrides,
  }
}

describe('Register', () => {
  it('devuelve el identificador de la cuenta creada', async () => {
    const repository = new FakeAuthRepository()
    const register = new Register(repository)

    const result = await register.execute(anInput())

    expect(result).toEqual({ ok: true, value: 'u-nuevo' })
    expect(repository.lastRegistration?.acceptedTerms).toBe(true)
  })

  it('rechaza una contraseña débil sin llamar al repositorio', async () => {
    const repository = new FakeAuthRepository()
    const register = new Register(repository)

    const result = await register.execute(anInput({ password: 'secreta' }))

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.code).toBe('VALIDATION')
    expect(repository.lastRegistration).toBeNull()
  })

  it('normaliza el correo quitando espacios y pasando a minúsculas', async () => {
    const repository = new FakeAuthRepository()
    const register = new Register(repository)

    await register.execute(anInput({ email: ' Ana@NX036.COM ' }))

    expect(repository.lastRegistration?.email).toBe('ana@nx036.com')
  })

  it('propaga el conflicto cuando el correo ya está dado de alta', async () => {
    const repository = new FakeAuthRepository({ error: new AppError('CONFLICT', 'ya existe') })
    const register = new Register(repository)

    const result = await register.execute(anInput())

    expect(result.ok === false && result.error.code).toBe('CONFLICT')
  })
})
