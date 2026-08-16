import MockAdapter from 'axios-mock-adapter'

import { HttpClient } from '@core/http/http-client'
import { aCartLine } from '@features/cart/domain/testing/cart-builders'

import { HttpSavedCartRepository } from '../repositories/http-saved-cart.repository'

function makeClient(): { client: HttpClient; mock: MockAdapter } {
  const client = new HttpClient('https://api.test', {
    getAccessToken: () => 'token',
    getRefreshToken: () => null,
    onRefreshed: () => undefined,
    onExpired: () => undefined,
    getCountry: () => null,
    getLocale: () => 'es',
    getCurrency: () => 'EUR',
  })
  return { client, mock: new MockAdapter(client.raw) }
}

const LINE_OK = {
  productId: 'p-1',
  variantId: 'v-1',
  slug: 'camiseta-basica',
  title: 'Camiseta básica',
  image: 'https://cdn.nx036.com/p-1.jpg',
  variantLabel: 'Color: Rojo',
  sku: 'SKU-1',
  quantity: 2,
  moq: 2,
  // El panel web guarda además el precio congelado; la app lo descarta a propósito.
  unitPriceSource: 117,
  sourceCurrency: 'CNY',
}

describe('HttpSavedCartRepository', () => {
  it('recupera la lista guardada sin arrastrar el precio del panel web', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/saved-cart').reply(200, [LINE_OK])
    const repository = new HttpSavedCartRepository(client)

    const result = await repository.list()

    expect(result.ok && result.value).toEqual([
      {
        productId: 'p-1',
        variantId: 'v-1',
        slug: 'camiseta-basica',
        title: 'Camiseta básica',
        image: 'https://cdn.nx036.com/p-1.jpg',
        variantLabel: 'Color: Rojo',
        sku: 'SKU-1',
        quantity: 2,
        moq: 2,
      },
    ])
  })

  it('tolera una línea con los campos opcionales nulos', async () => {
    const { client, mock } = makeClient()
    mock
      .onGet('/me/saved-cart')
      .reply(200, [{ productId: 'p-1', variantId: null, image: null, sku: null, moq: null }])
    const repository = new HttpSavedCartRepository(client)

    const result = await repository.list()

    expect(result.ok && result.value).toEqual([
      { productId: 'p-1', slug: '', title: '', quantity: 1 },
    ])
  })

  it('guarda una línea con PUT y devuelve la lista resultante', async () => {
    const { client, mock } = makeClient()
    let body: unknown = null
    mock.onPut('/me/saved-cart').reply((config) => {
      body = JSON.parse(config.data as string)
      return [200, [LINE_OK]]
    })
    const repository = new HttpSavedCartRepository(client)

    const result = await repository.save(aCartLine({ variantId: 'v-1', quantity: 2 }))

    expect(body).toEqual({
      productId: 'p-1',
      variantId: 'v-1',
      slug: 'camiseta-basica',
      title: 'Camiseta básica',
      image: 'https://cdn.nx036.com/p-1.jpg',
      quantity: 2,
    })
    expect(result.ok && result.value).toHaveLength(1)
  })

  it('borra una línea con variante pasándola como parámetro de consulta', async () => {
    const { client, mock } = makeClient()
    let params: Record<string, unknown> = {}
    mock.onDelete('/me/saved-cart/p-1').reply((config) => {
      params = (config.params ?? {}) as Record<string, unknown>
      return [200, []]
    })
    const repository = new HttpSavedCartRepository(client)

    const result = await repository.remove('p-1', 'v-1')

    expect(params).toEqual({ variantId: 'v-1' })
    expect(result.ok && result.value).toEqual([])
  })

  it('borra una línea sin variante sin ensuciar la consulta', async () => {
    const { client, mock } = makeClient()
    let params: Record<string, unknown> = {}
    mock.onDelete('/me/saved-cart/p-1').reply((config) => {
      params = (config.params ?? {}) as Record<string, unknown>
      return [200, []]
    })
    const repository = new HttpSavedCartRepository(client)

    await repository.remove('p-1')

    expect(params).toEqual({})
  })

  it('escapa el identificador del producto en la ruta', async () => {
    const { client, mock } = makeClient()
    let url = ''
    mock.onDelete(/\/me\/saved-cart\/.*/).reply((config) => {
      url = config.url ?? ''
      return [200, []]
    })
    const repository = new HttpSavedCartRepository(client)

    await repository.remove('p/1')

    expect(url).toBe('/me/saved-cart/p%2F1')
  })

  it('fusiona los guardados del invitado enviando el array de líneas', async () => {
    const { client, mock } = makeClient()
    let body: unknown = null
    mock.onPost('/me/saved-cart/merge').reply((config) => {
      body = JSON.parse(config.data as string)
      return [200, [LINE_OK]]
    })
    const repository = new HttpSavedCartRepository(client)

    const result = await repository.merge([aCartLine({ quantity: 1 })])

    expect(Array.isArray(body)).toBe(true)
    expect(result.ok && result.value[0]?.productId).toBe('p-1')
  })

  it('traduce un 500 a SERVER conservando el mensaje del backend', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/saved-cart').reply(500, { message: 'Se ha roto' })
    const repository = new HttpSavedCartRepository(client)

    const result = await repository.list()

    expect(!result.ok && result.error.code).toBe('SERVER')
    expect(!result.ok && result.error.message).toBe('Se ha roto')
  })

  it('traduce un fallo de red a NETWORK', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/saved-cart').networkError()
    const repository = new HttpSavedCartRepository(client)

    const result = await repository.list()

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.code).toBe('NETWORK')
  })

  it('falla con CONTRACT si la respuesta no es una lista', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/saved-cart').reply(200, { items: [LINE_OK] })
    const repository = new HttpSavedCartRepository(client)

    const result = await repository.list()

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })
})
