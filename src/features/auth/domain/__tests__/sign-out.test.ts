import { AppError } from '@core/errors/app-error'

import { SignOut } from '../usecases/sign-out'
import { FakeAuthRepository, FakeSessionStorage } from '../testing/fake-auth-repository'

describe('SignOut', () => {
  it('revoca la sesión en el servidor y vacía el almacén local', async () => {
    const repository = new FakeAuthRepository()
    const storage = new FakeSessionStorage()
    await storage.save({ accessToken: 'a', refreshToken: 'r' })
    const signOut = new SignOut(repository, storage)

    const result = await signOut.execute()

    expect(result.ok).toBe(true)
    expect(repository.signOutCalls).toBe(1)
    expect(await storage.load()).toBeNull()
  })

  it('vacía el almacén local aunque la llamada remota falle', async () => {
    const repository = new FakeAuthRepository({ error: new AppError('NETWORK', 'sin conexión') })
    const storage = new FakeSessionStorage()
    await storage.save({ accessToken: 'a', refreshToken: 'r' })
    const signOut = new SignOut(repository, storage)

    const result = await signOut.execute()

    expect(result.ok).toBe(true)
    expect(await storage.load()).toBeNull()
  })
})
