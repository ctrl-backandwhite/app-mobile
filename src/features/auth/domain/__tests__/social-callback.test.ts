import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'

import { readSocialCallback } from '../policies/social-callback'
import { CompleteSocialLogin } from '../usecases/complete-social-login'
import { aUser, FakeAuthRepository, FakeSessionStorage } from '../testing/fake-auth-repository'

describe('readSocialCallback', () => {
  it('saca los tokens del fragmento del enlace', () => {
    // Van en el fragmento y no en la consulta a propósito: así no llegan al servidor ni quedan en
    // los registros de los proxys.
    const result = readSocialCallback('nx036://auth/callback#token=acceso&refresh=renovacion')

    expect(result.accessToken).toBe('acceso')
    expect(result.refreshToken).toBe('renovacion')
    expect(result.rejection).toBeUndefined()
  })

  it('reconoce que la cuenta pide vincularse con la contraseña', () => {
    const result = readSocialCallback('nx036://auth/callback?link=required')

    expect(result.rejection).toContain('contraseña')
    expect(result.accessToken).toBeUndefined()
  })

  it('traduce los motivos de rechazo conocidos', () => {
    expect(readSocialCallback('nx036://auth/callback?error=2fa_required').rejection).toContain(
      'dos pasos',
    )
    expect(
      readSocialCallback('nx036://auth/callback?error=google_email_unverified').rejection,
    ).toContain('Google')
  })

  it('no se queda mudo ante un motivo desconocido', () => {
    const result = readSocialCallback('nx036://auth/callback?error=algo_nuevo')

    expect(result.rejection).toBeTruthy()
  })

  it('avisa cuando el enlace no trae sesión', () => {
    expect(readSocialCallback('nx036://auth/callback').rejection).toBeTruthy()
    expect(readSocialCallback('nx036://auth/callback#token=solo-uno').rejection).toBeTruthy()
  })

  it('no decide nada mientras no hay enlace', () => {
    expect(readSocialCallback(null)).toEqual({})
    expect(readSocialCallback(undefined)).toEqual({})
  })
})

describe('CompleteSocialLogin', () => {
  it('pide el perfil con el token recibido y guarda la sesión', async () => {
    const user = aUser({ displayName: 'Ana' })
    const repository = new FakeAuthRepository({ user })
    const storage = new FakeSessionStorage()

    const result = await new CompleteSocialLogin(repository, storage).execute('a', 'r')

    expect(result.ok && result.value.user.displayName).toBe('Ana')
    expect(await storage.load()).toEqual({ accessToken: 'a', refreshToken: 'r' })
  })

  it('no guarda sesión si el token no sirve para leer el perfil', async () => {
    // Un token que el backend rechaza no es una sesión: guardarlo dejaría la app creyendo que hay
    // alguien dentro.
    const repository = new FakeAuthRepository({ error: new AppError('INVALID_CREDENTIALS', 'no') })
    const storage = new FakeSessionStorage()

    const result = await new CompleteSocialLogin(repository, storage).execute('a', 'r')

    expect(result.ok).toBe(false)
    expect(await storage.load()).toBeNull()
  })

  it('rechaza un par de tokens incompleto sin llamar al backend', async () => {
    const repository = new FakeAuthRepository({ user: aUser() })
    const storage = new FakeSessionStorage()

    const result = await new CompleteSocialLogin(repository, storage).execute('a', '')

    expect(!result.ok && result.error.code).toBe('CONTRACT')
    expect(await storage.load()).toBeNull()
  })
})

/** Comprobación cruzada: el doble responde a `ok`/`err` como el repositorio real. */
describe('dobles', () => {
  it('el repositorio falso devuelve un resultado correcto', async () => {
    expect(await new FakeAuthRepository({ user: aUser() }).currentUser()).toEqual(ok(aUser()))
    expect((await new FakeAuthRepository({ error: new AppError('NETWORK', 'x') }).currentUser()).ok)
      .toBe(false)
    expect(err(new AppError('NETWORK', 'x')).ok).toBe(false)
  })
})
