import { AppError } from '@core/errors/app-error'

import { SignIn } from '../usecases/sign-in'
import { FakeAuthRepository, FakeSessionStorage, aUser } from '../testing/fake-auth-repository'

describe('SignIn', () => {
  it('guarda los tokens y devuelve el usuario cuando las credenciales son correctas', async () => {
    const user = aUser({ email: 'ana@nx036.com' })
    const repository = new FakeAuthRepository({
      session: { accessToken: 'a', refreshToken: 'r', user },
    })
    const storage = new FakeSessionStorage()
    const signIn = new SignIn(repository, storage)

    const result = await signIn.execute({ email: 'ana@nx036.com', password: 'Secreta1!' })

    // Devuelve la sesión completa: el usuario y los tokens que quien llama necesita en memoria.
    expect(result).toEqual({ ok: true, value: { accessToken: 'a', refreshToken: 'r', user } })
    expect(await storage.load()).toEqual({ accessToken: 'a', refreshToken: 'r' })
  })

  it('propaga MFA_REQUIRED sin guardar nada', async () => {
    const repository = new FakeAuthRepository({
      error: new AppError('MFA_REQUIRED', 'Introduce el código'),
    })
    const storage = new FakeSessionStorage()
    const signIn = new SignIn(repository, storage)

    const result = await signIn.execute({ email: 'ana@nx036.com', password: 'Secreta1!' })

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.code).toBe('MFA_REQUIRED')
    expect(await storage.load()).toBeNull()
  })

  it('reenvía el código de un solo uso cuando se aporta', async () => {
    const repository = new FakeAuthRepository({
      session: { accessToken: 'a', refreshToken: 'r', user: aUser() },
    })
    const signIn = new SignIn(repository, new FakeSessionStorage())

    await signIn.execute({ email: 'ana@nx036.com', password: 'Secreta1!', otp: '123456' })

    expect(repository.lastCredentials?.otp).toBe('123456')
  })

  it('normaliza el correo quitando espacios y pasando a minúsculas', async () => {
    const repository = new FakeAuthRepository({
      session: { accessToken: 'a', refreshToken: 'r', user: aUser() },
    })
    const signIn = new SignIn(repository, new FakeSessionStorage())

    await signIn.execute({ email: '  Ana@NX036.com ', password: 'Secreta1!' })

    expect(repository.lastCredentials?.email).toBe('ana@nx036.com')
  })

  it('no guarda nada cuando el repositorio falla sin un motivo conocido', async () => {
    const storage = new FakeSessionStorage()
    const signIn = new SignIn(new FakeAuthRepository(), storage)

    const result = await signIn.execute({ email: 'ana@nx036.com', password: 'mala' })

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.code).toBe('UNKNOWN')
    expect(await storage.load()).toBeNull()
  })

  it('descarta un código de un solo uso en blanco', async () => {
    const repository = new FakeAuthRepository({
      session: { accessToken: 'a', refreshToken: 'r', user: aUser() },
    })
    const signIn = new SignIn(repository, new FakeSessionStorage())

    await signIn.execute({ email: 'ana@nx036.com', password: 'Secreta1!', otp: '   ' })

    expect(repository.lastCredentials?.otp).toBeUndefined()
  })
})
