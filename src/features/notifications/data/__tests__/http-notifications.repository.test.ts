import MockAdapter from 'axios-mock-adapter'

import { HttpClient } from '@core/http/http-client'

import { HttpNotificationsRepository } from '../repositories/http-notifications.repository'

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

describe('HttpNotificationsRepository', () => {
  it('pide solo la bandeja de entrada', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/notifications').reply(200, [])

    await new HttpNotificationsRepository(client).inbox()

    expect(mock.history.get[0]?.params).toEqual({ folder: 'inbox' })
  })

  /** El backend no manda un booleano: manda CUÁNDO se leyó. Sin fecha, sin leer. */
  it('deduce si está leído de la fecha de lectura', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/notifications').reply(200, [
      { id: 'n-1', title: 'Leído', readAt: '2026-09-06T11:00:00Z' },
      { id: 'n-2', title: 'Sin leer', readAt: null },
    ])

    const result = await new HttpNotificationsRepository(client).inbox()

    expect(result.ok && result.value.map((n) => n.read)).toEqual([true, false])
  })

  it('rellena los textos que el backend deja vacíos', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/notifications').reply(200, [{ id: 'n-3' }])

    const result = await new HttpNotificationsRepository(client).inbox()

    expect(result.ok && result.value).toEqual([
      { id: 'n-3', title: 'Aviso', body: '', eventType: '', read: false, createdAt: '' },
    ])
  })

  it('trata una respuesta vacía como bandeja vacía', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/notifications').reply(200)

    const result = await new HttpNotificationsRepository(client).inbox()

    expect(result.ok && result.value).toEqual([])
  })

  it('falla con CONTRACT si un aviso viene sin identificador', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/notifications').reply(200, [{ title: 'sin id' }])

    const result = await new HttpNotificationsRepository(client).inbox()

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('marca uno como leído', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/notifications/n-1/read').reply(204)

    const result = await new HttpNotificationsRepository(client).markRead('n-1')

    expect(result.ok).toBe(true)
  })

  it('marca todos como leídos', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/notifications/read-all').reply(204)

    const result = await new HttpNotificationsRepository(client).markAllRead()

    expect(result.ok).toBe(true)
  })

  it('archiva', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/notifications/n-1/archive').reply(204)

    const result = await new HttpNotificationsRepository(client).archive('n-1')

    expect(result.ok).toBe(true)
  })

  it('traduce un fallo de red', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/notifications').networkError()

    const result = await new HttpNotificationsRepository(client).inbox()

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})
