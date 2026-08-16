import { InMemoryStore } from '@core/storage/in-memory.adapter'

import { SecureSessionStorage } from '../repositories/secure-session.storage'

describe('SecureSessionStorage', () => {
  it('guarda y recupera el par de tokens', async () => {
    const storage = new SecureSessionStorage(new InMemoryStore())

    await storage.save({ accessToken: 'a', refreshToken: 'r' })

    expect(await storage.load()).toEqual({ accessToken: 'a', refreshToken: 'r' })
  })

  it('devuelve nulo cuando no hay nada guardado', async () => {
    expect(await new SecureSessionStorage(new InMemoryStore()).load()).toBeNull()
  })

  it('trata media sesión como ausencia de sesión', async () => {
    const secrets = new InMemoryStore()
    await secrets.set('nx036.accessToken', 'solo-el-de-acceso')

    expect(await new SecureSessionStorage(secrets).load()).toBeNull()
  })

  it('borra los dos tokens al limpiar', async () => {
    const secrets = new InMemoryStore()
    const storage = new SecureSessionStorage(secrets)
    await storage.save({ accessToken: 'a', refreshToken: 'r' })

    await storage.clear()

    expect(await secrets.get('nx036.accessToken')).toBeNull()
    expect(await secrets.get('nx036.refreshToken')).toBeNull()
    expect(await storage.load()).toBeNull()
  })
})
