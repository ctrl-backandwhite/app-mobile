import MockAdapter from 'axios-mock-adapter'

import { HttpClient } from '@core/http/http-client'

import { HttpRegionRepository } from '../repositories/http-region.repository'

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

describe('HttpRegionRepository · idiomas', () => {
  it('devuelve los publicados con su bandera', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/languages').reply(200, [{ code: 'es', label: 'Español', flag: '🇪🇸' }])

    const result = await new HttpRegionRepository(client).languages()

    expect(result.ok && result.value).toEqual([{ code: 'es', label: 'Español', flag: '🇪🇸' }])
  })

  /**
   * Un idioma desactivado sigue viajando en la respuesta. Ofrecerlo dejaría la tienda a medio
   * traducir para quien lo eligiera, que es peor que no ofrecerlo.
   */
  it('descarta los desactivados y deja pasar los que no dicen nada', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/languages').reply(200, [
      { code: 'es', label: 'Español', active: true },
      { code: 'ru', label: 'Ruso', active: false },
      { code: 'de', label: 'Alemán' },
    ])

    const result = await new HttpRegionRepository(client).languages()

    expect(result.ok && result.value.map((l) => l.code)).toEqual(['es', 'de'])
  })

  it('deja la bandera vacía si el backend no la manda', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/languages').reply(200, [{ code: 'nl', label: 'Neerlandés', flag: null }])

    const result = await new HttpRegionRepository(client).languages()

    expect(result.ok && result.value.map((l) => l.flag)).toEqual([''])
  })

  it('traduce un fallo de red a NETWORK', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/languages').networkError()

    const result = await new HttpRegionRepository(client).languages()

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })

  it('falla con CONTRACT si la respuesta no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/languages').reply(200, { idiomas: ['es'] })

    const result = await new HttpRegionRepository(client).languages()

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })
})

describe('HttpRegionRepository · divisas', () => {
  it('devuelve las activas con su símbolo', async () => {
    const { client, mock } = makeClient()
    mock
      .onGet('/currency/rates')
      .reply(200, [{ code: 'EUR', name: 'Euro', symbol: '€', flagEmoji: '🇪🇺' }])

    const result = await new HttpRegionRepository(client).currencies()

    expect(result.ok && result.value).toEqual([
      { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    ])
  })

  it('descarta las desactivadas', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/currency/rates').reply(200, [
      { code: 'EUR', name: 'Euro', active: true },
      { code: 'VES', name: 'Bolívar', active: false },
    ])

    const result = await new HttpRegionRepository(client).currencies()

    expect(result.ok && result.value.map((c) => c.code)).toEqual(['EUR'])
  })

  /** Sin símbolo se escribe el código: «12,30 CZK» se entiende, «12,30 » no. */
  it('cae al código cuando no hay símbolo', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/currency/rates').reply(200, [{ code: 'CZK', name: 'Corona checa' }])

    const result = await new HttpRegionRepository(client).currencies()

    expect(result.ok && result.value[0]).toEqual({
      code: 'CZK',
      name: 'Corona checa',
      symbol: 'CZK',
      flag: '',
    })
  })

  it('traduce un fallo de red a NETWORK', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/currency/rates').networkError()

    const result = await new HttpRegionRepository(client).currencies()

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })

  it('falla con CONTRACT si la respuesta no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/currency/rates').reply(200, [{ code: 'EUR' }])

    const result = await new HttpRegionRepository(client).currencies()

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })
})
