import MockAdapter from 'axios-mock-adapter'

import { HttpClient } from '@core/http/http-client'

import { HttpHistoryRepository } from '../repositories/http-history.repository'

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

const PAGINA_OK = {
  items: [
    {
      id: 'p-1',
      slug: 'botas-martin',
      title: 'Botas Martin',
      mainImage: 'https://cdn.nx036.com/media/aa/aaa.jpg',
      monthlySales: 120,
      status: 'ACTIVE',
      displayFormatted: '29,80 €',
    },
  ],
  page: 0,
  size: 24,
  totalElements: 1,
  totalPages: 1,
}

describe('HttpHistoryRepository', () => {
  it('lee el historial del mismo endpoint que la web y con el idioma pedido', async () => {
    const { client, mock } = makeClient()
    let params: Record<string, unknown> = {}
    mock.onGet('/me/product-views').reply((config) => {
      params = (config.params ?? {}) as Record<string, unknown>
      return [200, PAGINA_OK]
    })

    const result = await new HttpHistoryRepository(client).list(0, 24, 'fr')

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.items[0]?.title).toBe('Botas Martin')
    expect(params).toMatchObject({ page: 0, size: 24, lang: 'fr' })
  })

  it('una respuesta con otra forma falla como contrato, no como pantalla vacía', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/product-views').reply(200, { resultados: [] })

    const result = await new HttpHistoryRepository(client).list(0, 24, 'es')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('CONTRACT')
  })

  it('anota la visita contra el identificador del producto', async () => {
    const { client, mock } = makeClient()
    let url = ''
    mock.onPost(/\/me\/product-views\/.*/).reply((config) => {
      url = config.url ?? ''
      return [200, { recorded: true }]
    })

    const result = await new HttpHistoryRepository(client).record('p-1')

    expect(result.ok).toBe(true)
    expect(url).toBe('/me/product-views/p-1')
  })

  it('devuelve el error del servidor al anotar, sin lanzarlo', async () => {
    const { client, mock } = makeClient()
    mock.onPost(/\/me\/product-views\/.*/).reply(500)

    const result = await new HttpHistoryRepository(client).record('p-1')

    expect(result.ok).toBe(false)
  })
})
