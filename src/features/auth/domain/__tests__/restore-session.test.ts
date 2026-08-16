import { AppError } from '@core/errors/app-error'

import { RestoreSession } from '../usecases/restore-session'
import { FakeAuthRepository, FakeSessionStorage, aUser } from '../testing/fake-auth-repository'

describe('RestoreSession', () => {
  it('devuelve nulo sin tokens guardados', async () => {
    const repository = new FakeAuthRepository({ user: aUser() })
    const restore = new RestoreSession(repository, new FakeSessionStorage())

    const result = await restore.execute()

    expect(result).toEqual({ ok: true, value: null })
  })

  it('recarga el perfil cuando hay tokens válidos', async () => {
    const user = aUser({ displayName: 'Ana' })
    const storage = new FakeSessionStorage()
    await storage.save({ accessToken: 'a', refreshToken: 'r' })
    const restore = new RestoreSession(new FakeAuthRepository({ user }), storage)

    const result = await restore.execute()

    // Los tokens viajan de vuelta junto al perfil para poder publicarlos en memoria al arrancar.
    expect(result).toEqual({ ok: true, value: { accessToken: 'a', refreshToken: 'r', user } })
    expect(await storage.load()).toEqual({ accessToken: 'a', refreshToken: 'r' })
  })

  it('limpia el almacén y arranca como invitado con tokens caducados', async () => {
    const repository = new FakeAuthRepository({
      error: new AppError('INVALID_CREDENTIALS', 'sesión caducada'),
    })
    const storage = new FakeSessionStorage()
    await storage.save({ accessToken: 'viejo', refreshToken: 'viejo' })
    const restore = new RestoreSession(repository, storage)

    const result = await restore.execute()

    expect(result).toEqual({ ok: true, value: null })
    expect(await storage.load()).toBeNull()
  })
})
