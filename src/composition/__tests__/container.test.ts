import { waitFor } from '@testing-library/react-native'
import MockAdapter from 'axios-mock-adapter'

import { AppConfig } from '@core/config/env'
import { InMemoryStore } from '@core/storage/in-memory.adapter'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

import { buildContainer } from '../container'

const CONFIG: AppConfig = {
  apiBaseUrl: 'https://api.test',
  webBaseUrl: 'https://nx036.test',
  defaultCurrency: 'USD',
  defaultLocale: 'es',
}

function build() {
  return buildContainer(CONFIG, {
    secrets: new InMemoryStore(),
    captcha: { solve: async () => 'altcha' },
  })
}

describe('buildContainer', () => {
  beforeEach(() => {
    useSessionStore.setState({
      user: null,
      status: 'anonymous',
      accessToken: null,
      refreshToken: null,
      currency: 'USD',
      locale: 'es',
    })
  })

  it('cablea los ocho casos de uso', () => {
    const container = build()

    expect(container.signIn).toBeDefined()
    expect(container.signOut).toBeDefined()
    expect(container.restoreSession).toBeDefined()
    expect(container.register).toBeDefined()
    expect(container.activateAccount).toBeDefined()
    expect(container.resendActivation).toBeDefined()
    expect(container.requestPasswordReset).toBeDefined()
    expect(container.confirmPasswordReset).toBeDefined()
  })

  it('apunta el cliente HTTP al backend configurado', () => {
    expect(build().http.raw.defaults.baseURL).toBe('https://api.test/api')
  })

  it('el puente de sesión lleva al backend el token, el país y el idioma del estado', async () => {
    const container = build()
    const mock = new MockAdapter(container.http.raw)
    useSessionStore.getState().signedIn(
      {
        id: 'u-1',
        email: 'ana@nx036.com',
        role: 'USER',
        active: true,
        country: 'ES',
        language: 'pt',
        createdAt: '2026-01-01T00:00:00Z',
        authorities: [],
      },
      'token-vivo',
      'renovacion',
    )
    useSessionStore.getState().setCurrency('EUR')

    let cabeceras: Record<string, unknown> = {}
    mock.onGet('/me').reply((config) => {
      cabeceras = config.headers as unknown as Record<string, unknown>
      return [200, {}]
    })
    await container.http.get('/me')

    expect(cabeceras.Authorization).toBe('Bearer token-vivo')
    expect(cabeceras['X-Country']).toBe('ES')
    expect(cabeceras['X-Lang']).toBe('pt')
    expect(cabeceras['X-Currency']).toBe('EUR')
  })

  it('el puente descarta la sesión cuando el backend la da por caducada', async () => {
    const secrets = new InMemoryStore()
    const container = buildContainer(CONFIG, { secrets, captcha: { solve: async () => 'altcha' } })
    await container.sessionStorage.save({ accessToken: 'viejo', refreshToken: 'viejo-r' })
    useSessionStore.getState().signedIn(
      {
        id: 'u-1',
        email: 'ana@nx036.com',
        role: 'USER',
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
        authorities: [],
      },
      'viejo',
      'viejo-r',
    )
    const mock = new MockAdapter(container.http.raw)
    new MockAdapter(container.http.rawRefresh).onPost('/auth/refresh').reply(401)
    mock.onGet('/me').reply(401)

    await expect(container.http.get('/me')).rejects.toBeDefined()

    await waitFor(() => expect(useSessionStore.getState().status).toBe('anonymous'))
    expect(await container.sessionStorage.load()).toBeNull()
  })

  it('guarda los tokens renovados en el almacén y en memoria', async () => {
    const secrets = new InMemoryStore()
    const container = buildContainer(CONFIG, { secrets, captcha: { solve: async () => 'altcha' } })

    // Se ejerce a través del almacén del contenedor, que es el mismo que recibe el puente.
    await container.sessionStorage.save({ accessToken: 'a', refreshToken: 'r' })

    expect(await container.sessionStorage.load()).toEqual({ accessToken: 'a', refreshToken: 'r' })
    expect(await secrets.get('nx036.accessToken')).toBe('a')
  })
})
