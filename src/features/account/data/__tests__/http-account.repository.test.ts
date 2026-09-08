import MockAdapter from 'axios-mock-adapter'

import { HttpClient } from '@core/http/http-client'

import { HttpAccountRepository } from '../repositories/http-account.repository'

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

describe('HttpAccountRepository · contraseña', () => {
  it('manda la actual y la nueva con los nombres del backend', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/password').reply(204)

    const result = await new HttpAccountRepository(client).changePassword('Vieja1!x', 'Nueva1!x')

    expect(result.ok).toBe(true)
    expect(JSON.parse(mock.history.post[0]?.data ?? '{}')).toEqual({
      currentPassword: 'Vieja1!x',
      newPassword: 'Nueva1!x',
    })
  })

  it('traduce el rechazo del backend', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/password').reply(400, { message: 'La contraseña actual no coincide' })

    const result = await new HttpAccountRepository(client).changePassword('mala', 'Nueva1!x')

    expect(result.ok).toBe(false)
  })
})

describe('HttpAccountRepository · sesiones', () => {
  it('traduce la lista', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/sessions').reply(200, [
      {
        id: 's-1',
        device: 'Pixel 8',
        ip: '10.0.0.1',
        createdAt: '2026-09-01T10:00:00Z',
        lastSeenAt: '2026-09-06T10:00:00Z',
        current: true,
      },
    ])

    const result = await new HttpAccountRepository(client).sessions()

    expect(result.ok && result.value).toEqual([
      {
        id: 's-1',
        device: 'Pixel 8',
        ip: '10.0.0.1',
        createdAt: '2026-09-01T10:00:00Z',
        lastSeenAt: '2026-09-06T10:00:00Z',
        current: true,
      },
    ])
  })

  /**
   * El backend deduce el dispositivo de la cabecera del navegador y a veces no hay nada que deducir.
   * Una fila sin descripción sigue siendo una sesión que hay que poder cerrar, así que se rellena en
   * vez de descartarla.
   */
  it('aguanta una sesión sin dispositivo ni dirección', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/sessions').reply(200, [{ id: 's-2', device: null, ip: null }])

    const result = await new HttpAccountRepository(client).sessions()

    expect(result.ok && result.value).toEqual([
      {
        id: 's-2',
        device: 'Dispositivo desconocido',
        ip: '',
        createdAt: '',
        lastSeenAt: '',
        current: false,
      },
    ])
  })

  it('trata una respuesta vacía como que no hay ninguna', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/sessions').reply(200)

    const result = await new HttpAccountRepository(client).sessions()

    expect(result.ok && result.value).toEqual([])
  })

  it('falla con CONTRACT si la lista no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/sessions').reply(200, [{ device: 'sin id' }])

    const result = await new HttpAccountRepository(client).sessions()

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('cierra la sesión pedida', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/sessions/s-9/revoke').reply(204)

    const result = await new HttpAccountRepository(client).revokeSession('s-9')

    expect(result.ok).toBe(true)
  })

  it('traduce un fallo de red al cerrar', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/sessions/s-9/revoke').networkError()

    const result = await new HttpAccountRepository(client).revokeSession('s-9')

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})

describe('HttpAccountRepository · borrado', () => {
  it('pide el código al primer paso', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/delete/request').reply(204)

    const result = await new HttpAccountRepository(client).requestDeletion()

    expect(result.ok).toBe(true)
  })

  it('confirma con el código', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/delete/confirm').reply(204)

    const result = await new HttpAccountRepository(client).confirmDeletion('123456')

    expect(result.ok).toBe(true)
    expect(JSON.parse(mock.history.post[0]?.data ?? '{}')).toEqual({ code: '123456' })
  })

  it('traduce un código caducado', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/delete/confirm').reply(400, { message: 'Código caducado' })

    const result = await new HttpAccountRepository(client).confirmDeletion('000000')

    expect(result.ok).toBe(false)
  })
})
