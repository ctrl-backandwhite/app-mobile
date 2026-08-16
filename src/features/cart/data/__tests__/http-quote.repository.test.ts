import MockAdapter from 'axios-mock-adapter'

import { HttpClient } from '@core/http/http-client'

import { HttpQuoteRepository } from '../repositories/http-quote.repository'

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

const QUOTE_OK = {
  currency: 'EUR',
  symbol: '€',
  items: [
    {
      productId: 'p-1',
      variantId: 'v-1',
      unit: 14.9,
      lineTotal: 29.8,
      unitFormatted: '14,90 €',
      lineTotalFormatted: '29,80 €',
    },
  ],
  subtotal: 29.8,
  subtotalFormatted: '29,80 €',
}

describe('HttpQuoteRepository', () => {
  it('envía el array de artículos y devuelve los importes ya formateados', async () => {
    const { client, mock } = makeClient()
    let body: unknown = null
    mock.onPost('/catalog/cart-quote').reply((config) => {
      body = JSON.parse(config.data as string)
      return [200, QUOTE_OK]
    })
    const repository = new HttpQuoteRepository(client)

    const result = await repository.quote([{ productId: 'p-1', variantId: 'v-1', quantity: 2 }])

    expect(body).toEqual([{ productId: 'p-1', variantId: 'v-1', quantity: 2 }])
    expect(result.ok && result.value.currency).toBe('EUR')
    expect(result.ok && result.value.symbol).toBe('€')
    expect(result.ok && result.value.subtotalFormatted).toBe('29,80 €')
    expect(result.ok && result.value.items[0]?.lineTotalFormatted).toBe('29,80 €')
    expect(result.ok && result.value.items[0]?.variantId).toBe('v-1')
  })

  it('tolera un presupuesto sin líneas ni subtotal formateado', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/catalog/cart-quote').reply(200, { currency: 'USD', subtotal: 0 })
    const repository = new HttpQuoteRepository(client)

    const result = await repository.quote([{ productId: 'p-1', quantity: 1 }])

    expect(result.ok && result.value.items).toEqual([])
    expect(result.ok && result.value.symbol).toBe('')
    expect(result.ok && result.value.subtotalFormatted).toBeUndefined()
  })

  it('convierte la variante nula en ausencia de variante', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/catalog/cart-quote').reply(200, {
      currency: 'EUR',
      symbol: '€',
      items: [{ productId: 'p-1', variantId: null, unitFormatted: '9,90 €' }],
    })
    const repository = new HttpQuoteRepository(client)

    const result = await repository.quote([{ productId: 'p-1', quantity: 1 }])

    expect(result.ok && result.value.items[0]?.variantId).toBeUndefined()
  })

  it('traduce un fallo de red a NETWORK', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/catalog/cart-quote').networkError()
    const repository = new HttpQuoteRepository(client)

    const result = await repository.quote([{ productId: 'p-1', quantity: 1 }])

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })

  it('falla con CONTRACT si el presupuesto no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/catalog/cart-quote').reply(200, { items: [] })
    const repository = new HttpQuoteRepository(client)

    const result = await repository.quote([{ productId: 'p-1', quantity: 1 }])

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })
})
