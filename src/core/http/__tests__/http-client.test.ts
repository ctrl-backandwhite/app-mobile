import MockAdapter from 'axios-mock-adapter'

import { loadDeviceId, resetDeviceIdForTests } from '@core/device/device-identity'
import { PreferenceStore } from '@core/storage/ports'

import { HttpClient } from '../http-client'
import { SessionBridge } from '../session-bridge'

interface SpyBridge extends SessionBridge {
  expired: boolean
  saved: string[]
}

function bridgeWith(access: string | null, refresh: string | null): SpyBridge {
  return {
    expired: false,
    saved: [],
    getAccessToken: () => access,
    getRefreshToken: () => refresh,
    onRefreshed(newAccess: string, newRefresh: string) {
      this.saved.push(newAccess, newRefresh)
    },
    onExpired() {
      this.expired = true
    },
    getCountry: () => 'ES',
    getLocale: () => 'es',
    getCurrency: () => 'EUR',
  }
}

describe('HttpClient', () => {
  it('adjunta el token y las cabeceras de divisa, país e idioma', async () => {
    const bridge = bridgeWith('token-1', 'refresh-1')
    const client = new HttpClient('https://api.test', bridge)
    const mock = new MockAdapter(client.raw)
    mock.onGet('/me').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer token-1')
      expect(config.headers?.['X-Currency']).toBe('EUR')
      expect(config.headers?.['X-Country']).toBe('ES')
      expect(config.headers?.['X-Lang']).toBe('es')
      expect(config.headers?.['Accept-Language']).toBe('es')
      return [200, { id: '1' }]
    })

    await expect(client.get('/me')).resolves.toEqual({ id: '1' })
  })

  /**
   * El backend necesita saber que quien pide es la aplicación para devolverla a su enlace profundo
   * al terminar un pago. Sin esta cabecera, PayPal devolvía a la web: la vista de navegador no se
   * cerraba, la persona la cerraba a mano y la app entendía «cancelado» habiendo pagado.
   *
   * Viaja un IDENTIFICADOR, nunca la dirección de vuelta: esa la elige el servidor entre las que él
   * mismo tiene configuradas.
   */
  it('se identifica como la aplicación móvil en cada petición', async () => {
    const client = new HttpClient('https://api.test', bridgeWith('token-1', 'refresh-1'))
    const mock = new MockAdapter(client.raw)
    mock.onGet('/me').reply((config) => {
      expect(config.headers?.['X-Client']).toBe('mobile')
      return [200, {}]
    })

    await client.get('/me')
  })

  /**
   * Quién es este teléfono. El backend lo reconocía por una cookie y un cliente nativo no las lleva:
   * cada entrada creaba una sesión NUEVA y la pantalla de seguridad acababa con cientos de filas
   * entre las que no se distinguía la propia.
   */
  it('dice quién es el teléfono y cómo se llama la aplicación', async () => {
    const guardado = 'aabbccddeeff00112233445566778899'
    const store: PreferenceStore = {
      get: async () => guardado,
      set: async () => undefined,
      remove: async () => undefined,
    }
    await loadDeviceId(store)
    const client = new HttpClient('https://api.test', bridgeWith('token-1', 'refresh-1'))
    const mock = new MockAdapter(client.raw)
    mock.onGet('/me').reply((config) => {
      expect(config.headers?.['X-Device-Id']).toBe(guardado)
      expect(config.headers?.['User-Agent']).toMatch(/^NX036\//)
      return [200, {}]
    })

    await client.get('/me')
    resetDeviceIdForTests()
  })

  /** Sin identificador preparado no se manda la cabecera: mejor eso que retener la petición. */
  it('no manda identificador de dispositivo si aún no se ha cargado', async () => {
    resetDeviceIdForTests()
    const client = new HttpClient('https://api.test', bridgeWith('token-1', 'refresh-1'))
    const mock = new MockAdapter(client.raw)
    mock.onGet('/me').reply((config) => {
      expect(config.headers?.['X-Device-Id']).toBeUndefined()
      return [200, {}]
    })

    await client.get('/me')
  })

  it('omite la cabecera de país cuando no hay usuario con país', async () => {
    const bridge = bridgeWith('token-1', 'refresh-1')
    bridge.getCountry = () => null
    const client = new HttpClient('https://api.test', bridge)
    const mock = new MockAdapter(client.raw)
    mock.onGet('/me').reply((config) => {
      expect(config.headers?.['X-Country']).toBeUndefined()
      return [200, {}]
    })

    await client.get('/me')
  })

  it('no adjunta el token a una URL absoluta de un tercero', async () => {
    const bridge = bridgeWith('token-1', 'refresh-1')
    const client = new HttpClient('https://api.test', bridge)
    const mock = new MockAdapter(client.raw)
    mock.onGet('https://tercero.example/datos').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined()
      return [200, {}]
    })

    await client.get('https://tercero.example/datos')
  })

  it('renueva el token una sola vez aunque fallen varias peticiones a la vez', async () => {
    const bridge = bridgeWith('caducado', 'refresh-1')
    const client = new HttpClient('https://api.test', bridge)
    const mock = new MockAdapter(client.raw)
    const refreshMock = new MockAdapter(client.rawRefresh)
    let refreshCalls = 0
    let meCalls = 0
    let walletCalls = 0
    refreshMock.onPost('/auth/refresh').reply(() => {
      refreshCalls++
      return [200, { token: 'nuevo', refreshToken: 'refresh-2' }]
    })
    mock.onGet('/me').reply(() => [meCalls++ === 0 ? 401 : 200, { id: '1' }])
    mock.onGet('/me/wallet').reply(() => [walletCalls++ === 0 ? 401 : 200, { balance: 0 }])

    await Promise.all([client.get('/me'), client.get('/me/wallet')])

    expect(refreshCalls).toBe(1)
    expect(bridge.saved).toEqual(['nuevo', 'refresh-2'])
  })

  it('avisa de sesión expirada cuando la renovación falla', async () => {
    const bridge = bridgeWith('caducado', 'refresh-malo')
    const client = new HttpClient('https://api.test', bridge)
    const mock = new MockAdapter(client.raw)
    new MockAdapter(client.rawRefresh).onPost('/auth/refresh').reply(401)
    mock.onGet('/me').reply(401)

    await expect(client.get('/me')).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
    expect(bridge.expired).toBe(true)
  })

  it('no intenta renovar cuando no hay token de renovación', async () => {
    const bridge = bridgeWith('caducado', null)
    const client = new HttpClient('https://api.test', bridge)
    const mock = new MockAdapter(client.raw)
    let refreshCalls = 0
    new MockAdapter(client.rawRefresh).onPost('/auth/refresh').reply(() => {
      refreshCalls++
      return [200, {}]
    })
    mock.onGet('/me').reply(401)

    await expect(client.get('/me')).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
    expect(refreshCalls).toBe(0)
    expect(bridge.expired).toBe(true)
  })

  it('no reintenta la renovación cuando el que falla es el propio acceso', async () => {
    const bridge = bridgeWith(null, null)
    const client = new HttpClient('https://api.test', bridge)
    const mock = new MockAdapter(client.raw)
    let refreshCalls = 0
    new MockAdapter(client.rawRefresh).onPost('/auth/refresh').reply(() => {
      refreshCalls++
      return [200, {}]
    })
    mock.onPost('/auth/login').reply(401, { code: 'MFA_REQUIRED' })

    await expect(client.post('/auth/login', {})).rejects.toMatchObject({ code: 'MFA_REQUIRED' })
    expect(refreshCalls).toBe(0)
  })

  it('traduce la caída de red a un error de la aplicación', async () => {
    const client = new HttpClient('https://api.test', bridgeWith('t', 'r'))
    const mock = new MockAdapter(client.raw)
    mock.onGet('/me').networkError()

    await expect(client.get('/me')).rejects.toMatchObject({ code: 'NETWORK' })
  })
})
