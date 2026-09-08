import MockAdapter from 'axios-mock-adapter'

import { HttpClient } from '@core/http/http-client'

import { HttpPushRegistry } from '../repositories/http-push.registry'

function makeClient(): { client: HttpClient; mock: MockAdapter } {
  const client = new HttpClient('https://api.test', {
    getAccessToken: () => null,
    getRefreshToken: () => null,
    onRefreshed: () => undefined,
    onExpired: () => undefined,
    getCountry: () => null,
    getLocale: () => 'es',
    getCurrency: () => 'EUR',
  })
  return { client, mock: new MockAdapter(client.raw) }
}

describe('HttpPushRegistry', () => {
  it('registra el dispositivo con su token y su plataforma', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/devices').reply(204)

    const result = await new HttpPushRegistry(client).register({
      token: 'ExponentPushToken[abc]',
      platform: 'ios',
    })

    expect(result.ok).toBe(true)
    expect(JSON.parse(mock.history.post[0]?.data ?? '{}')).toEqual({
      token: 'ExponentPushToken[abc]',
      platform: 'ios',
    })
  })

  /** El token lleva corchetes: sin escaparlos, la ruta se parte y el backend borra otra cosa. */
  it('escapa el token al darlo de baja', async () => {
    const { client, mock } = makeClient()
    mock.onDelete(/\/me\/devices\/.+/).reply(204)

    const result = await new HttpPushRegistry(client).unregister('ExponentPushToken[a b]')

    expect(result.ok).toBe(true)
    expect(mock.history.delete[0]?.url).toBe(
      '/me/devices/ExponentPushToken%5Ba%20b%5D',
    )
  })

  it('traduce un fallo de red', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/devices').networkError()

    const result = await new HttpPushRegistry(client).register({ token: 't', platform: 'android' })

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})
