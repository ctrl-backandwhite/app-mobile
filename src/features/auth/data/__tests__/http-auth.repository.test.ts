import MockAdapter from 'axios-mock-adapter'

import { CaptchaSolver } from '@core/captcha/captcha-solver'
import { HttpClient } from '@core/http/http-client'

import { HttpAuthRepository } from '../repositories/http-auth.repository'

function makeClient(): { client: HttpClient; mock: MockAdapter } {
  const client = new HttpClient('https://api.test', {
    getAccessToken: () => null,
    getRefreshToken: () => null,
    onRefreshed: () => undefined,
    onExpired: () => undefined,
    getCountry: () => null,
    getLocale: () => 'es',
    getCurrency: () => 'USD',
  })
  return { client, mock: new MockAdapter(client.raw) }
}

const solver: CaptchaSolver = { solve: async () => 'prueba-resuelta' }

const LOGIN_OK = {
  token: 'acceso',
  refreshToken: 'renovacion',
  tokenType: 'Bearer',
  expiresIn: 3600,
  user: {
    id: 'u-1',
    email: 'ana@nx036.com',
    role: 'USER',
    active: true,
    displayName: 'Ana',
    createdAt: '2026-01-01T00:00:00Z',
    authorities: ['ROLE_USER'],
  },
}

describe('HttpAuthRepository', () => {
  it('devuelve la sesión cuando el acceso es correcto', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/auth/login').reply(200, LOGIN_OK)
    const repository = new HttpAuthRepository(client, solver)

    const result = await repository.signIn({ email: 'ana@nx036.com', password: 'Secreta1!' })

    expect(result.ok).toBe(true)
    expect(result.ok && result.value.accessToken).toBe('acceso')
    expect(result.ok && result.value.refreshToken).toBe('renovacion')
    expect(result.ok && result.value.user.displayName).toBe('Ana')
  })

  /**
   * El backend expresa «no hay dato» de dos formas —omitiendo el campo o mandando `null`— y hasta
   * ahora solo se admitía la primera. Con la segunda, entrar era IMPOSIBLE: un usuario sin teléfono ni
   * avatar —la mayoría— llegaba con `phone: null`, la validación se caía y la pantalla decía «La
   * respuesta del servidor no tiene el formato esperado», sin más pista.
   *
   * <p>Este es el cuerpo REAL que devuelve el backend, copiado de una respuesta suya.
   */
  it('entra con un usuario cuyos datos opcionales llegan como nulos', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/auth/login').reply(200, {
      ...LOGIN_OK,
      user: {
        ...LOGIN_OK.user,
        phone: null,
        avatarUrl: null,
        lastName1: 'Pérez',
        lastName2: null,
        companyName: null,
        country: 'ES',
        language: 'es',
        lastLogin: '2026-09-09T08:00:00Z',
      },
    })
    const repository = new HttpAuthRepository(client, solver)

    const result = await repository.signIn({ email: 'ana@nx036.com', password: 'Secreta1!' })

    expect(result.ok).toBe(true)
    // Y el nulo no se cuela hasta las pantallas: el dominio solo entiende «ausente».
    expect(result.ok && result.value.user.avatarUrl).toBeUndefined()
    expect(result.ok && result.value.user.companyName).toBeUndefined()
    expect(result.ok && result.value.user.country).toBe('ES')
  })

  it('envía el segundo factor cuando se aporta', async () => {
    const { client, mock } = makeClient()
    let body: Record<string, unknown> = {}
    mock.onPost('/auth/login').reply((config) => {
      body = JSON.parse(config.data as string) as Record<string, unknown>
      return [200, LOGIN_OK]
    })
    const repository = new HttpAuthRepository(client, solver)

    await repository.signIn({ email: 'ana@nx036.com', password: 'Secreta1!', otp: '123456' })

    expect(body.otp).toBe('123456')
    expect(body.linkSocial).toBe(false)
  })

  it('traduce el 401 con MFA_REQUIRED a un error de dominio', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/auth/login').reply(401, { code: 'MFA_REQUIRED' })
    const repository = new HttpAuthRepository(client, solver)

    const result = await repository.signIn({ email: 'ana@nx036.com', password: 'mala' })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.code).toBe('MFA_REQUIRED')
  })

  it('falla con CONTRACT si la respuesta no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/auth/login').reply(200, { token: 'acceso' })
    const repository = new HttpAuthRepository(client, solver)

    const result = await repository.signIn({ email: 'ana@nx036.com', password: 'Secreta1!' })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('recupera el perfil actual', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me').reply(200, LOGIN_OK.user)
    const repository = new HttpAuthRepository(client, solver)

    const result = await repository.currentUser()

    expect(result.ok && result.value.email).toBe('ana@nx036.com')
    expect(result.ok && result.value.role).toBe('USER')
  })

  it('tolera un perfil sin lista de permisos', async () => {
    const { client, mock } = makeClient()
    const { authorities, ...sinPermisos } = LOGIN_OK.user
    void authorities
    mock.onGet('/me').reply(200, sinPermisos)
    const repository = new HttpAuthRepository(client, solver)

    const result = await repository.currentUser()

    expect(result.ok && result.value.authorities).toEqual([])
  })

  it('adjunta la prueba de trabajo en la cabecera X-Altcha al registrarse', async () => {
    const { client, mock } = makeClient()
    let header: string | undefined
    mock.onPost('/auth/register').reply((config) => {
      header = config.headers?.['X-Altcha'] as string
      return [200, { userId: 'u-2', message: 'ok' }]
    })
    const repository = new HttpAuthRepository(client, solver)

    const result = await repository.register({
      email: 'ana@nx036.com',
      password: 'Secreta1!',
      acceptedTerms: true,
    })

    expect(header).toBe('prueba-resuelta')
    expect(result.ok && result.value).toBe('u-2')
  })

  it('propaga el mensaje del backend cuando el correo ya existe', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/auth/register').reply(409, { message: 'Ese correo ya tiene cuenta' })
    const repository = new HttpAuthRepository(client, solver)

    const result = await repository.register({
      email: 'ana@nx036.com',
      password: 'Secreta1!',
      acceptedTerms: true,
    })

    expect(!result.ok && result.error.code).toBe('CONFLICT')
    expect(!result.ok && result.error.message).toBe('Ese correo ya tiene cuenta')
  })

  it('activa la cuenta con el código', async () => {
    const { client, mock } = makeClient()
    let body: Record<string, unknown> = {}
    mock.onPost('/auth/activate').reply((config) => {
      body = JSON.parse(config.data as string) as Record<string, unknown>
      return [200, {}]
    })
    const repository = new HttpAuthRepository(client, solver)

    const result = await repository.activate('cod-123')

    expect(result.ok).toBe(true)
    expect(body.code).toBe('cod-123')
  })

  it('reenvía el código de activación con CAPTCHA', async () => {
    const { client, mock } = makeClient()
    let header: string | undefined
    mock.onPost('/auth/activate/resend').reply((config) => {
      header = config.headers?.['X-Altcha'] as string
      return [204]
    })
    const repository = new HttpAuthRepository(client, solver)

    const result = await repository.resendActivation('ana@nx036.com')

    expect(result.ok).toBe(true)
    expect(header).toBe('prueba-resuelta')
  })

  it('pide el restablecimiento con CAPTCHA', async () => {
    const { client, mock } = makeClient()
    let header: string | undefined
    mock.onPost('/auth/password-reset/request').reply((config) => {
      header = config.headers?.['X-Altcha'] as string
      return [200, {}]
    })
    const repository = new HttpAuthRepository(client, solver)

    await repository.requestPasswordReset('ana@nx036.com')

    expect(header).toBe('prueba-resuelta')
  })

  it('envía el código y la contraseña al confirmar el restablecimiento', async () => {
    const { client, mock } = makeClient()
    let body: Record<string, unknown> = {}
    mock.onPost('/auth/password-reset/confirm').reply((config) => {
      body = JSON.parse(config.data as string) as Record<string, unknown>
      return [200, {}]
    })
    const repository = new HttpAuthRepository(client, solver)

    await repository.confirmPasswordReset('cod-123', 'Secreta1!')

    expect(body).toEqual({ token: 'cod-123', newPassword: 'Secreta1!' })
  })

  it('cierra sesión contra el backend', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/auth/logout').reply(200)
    const repository = new HttpAuthRepository(client, solver)

    expect((await repository.signOut()).ok).toBe(true)
  })

  it('traduce el fallo del CAPTCHA sin llegar a llamar al backend', async () => {
    const { client, mock } = makeClient()
    let called = false
    mock.onPost('/auth/password-reset/request').reply(() => {
      called = true
      return [200, {}]
    })
    const repository = new HttpAuthRepository(client, {
      solve: async () => {
        throw new Error('sin solución')
      },
    })

    const result = await repository.requestPasswordReset('ana@nx036.com')

    expect(result.ok).toBe(false)
    expect(called).toBe(false)
  })
})
