import { HttpShippingRepository } from '../repositories/http-shipping.repository'
import { makeClient } from '../testing/make-client'

const QUOTE_OK = {
  supported: true,
  countryCode: 'ES',
  amountUsdCents: 480,
  carrier: 'YunExpress',
  serviceName: 'BPA',
  etaMinDays: 7,
  etaMaxDays: 15,
  zone: 'EU',
  taxRateBps: 2100,
  shippingFormatted: '4,20 €',
  shippingBaseFormatted: '1,20 €',
  customsHandlingFormatted: '3,00 €',
  customsHandlingUsdCents: 300,
  taxFormatted: '6,30 €',
  totalFormatted: '36,30 €',
  subtotalUsdCents: 2580,
  subtotalFormatted: '25,80 €',
  discountCents: 0,
  discountFormatted: '',
  customsThresholdExceeded: false,
  customsBlocked: false,
  customsLimit: '',
  taxMode: 'DDP',
  couponCode: '',
  couponError: '',
  items: [{ productId: 'p-1', quantity: 2, unitFormatted: '12,90 €', lineTotalFormatted: '25,80 €' }],
}

describe('HttpShippingRepository', () => {
  it('cotiza el destino con país, región, líneas y cupón', async () => {
    const { client, mock } = makeClient()
    let body: unknown = null
    mock.onPost('/shipping/quote').reply((config) => {
      body = JSON.parse(config.data as string)
      return [200, QUOTE_OK]
    })

    const result = await new HttpShippingRepository(client).quote({
      country: 'ES',
      region: 'MD',
      items: [{ productId: 'p-1', variantId: 'v-1', quantity: 2 }],
      couponCode: 'VERANO',
    })

    expect(body).toEqual({
      country: 'ES',
      region: 'MD',
      items: [{ productId: 'p-1', variantId: 'v-1', quantity: 2 }],
      couponCode: 'VERANO',
    })
    expect(result.ok && result.value.totalFormatted).toBe('36,30 €')
    expect(result.ok && result.value.shippingBaseFormatted).toBe('1,20 €')
    expect(result.ok && result.value.customsHandlingUsdCents).toBe(300)
  })

  it('convierte los importes vacíos en ausencia de importe', async () => {
    // Un «» pintaría un hueco donde no debe haber línea, y un hueco en un resumen se lee como cero.
    const { client, mock } = makeClient()
    mock.onPost('/shipping/quote').reply(200, QUOTE_OK)

    const result = await new HttpShippingRepository(client).quote({
      country: 'ES',
      items: [{ productId: 'p-1', quantity: 1 }],
    })

    expect(result.ok && result.value.discountFormatted).toBeUndefined()
    expect(result.ok && result.value.couponCode).toBeUndefined()
    expect(result.ok && result.value.customsLimit).toBeUndefined()
  })

  it('tolera una cotización mínima de un despliegue antiguo', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/shipping/quote').reply(200, { supported: false })

    const result = await new HttpShippingRepository(client).quote({
      country: 'XX',
      items: [{ productId: 'p-1', quantity: 1 }],
    })

    expect(result.ok && result.value.supported).toBe(false)
    expect(result.ok && result.value.taxRateBps).toBe(0)
    expect(result.ok && result.value.totalFormatted).toBeUndefined()
  })

  it('pide las regiones del país por parámetro', async () => {
    const { client, mock } = makeClient()
    let params: unknown = null
    mock.onGet('/shipping/regions').reply((config) => {
      params = config.params
      return [200, [{ code: 'CA', name: 'California' }]]
    })

    const result = await new HttpShippingRepository(client).regions('US')

    expect(params).toEqual({ country: 'US' })
    expect(result.ok && result.value).toEqual([{ code: 'CA', name: 'California' }])
  })

  it('traduce un fallo de red a NETWORK', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/shipping/quote').networkError()

    const result = await new HttpShippingRepository(client).quote({
      country: 'ES',
      items: [{ productId: 'p-1', quantity: 1 }],
    })

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })

  it('falla con CONTRACT si la cotización no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/shipping/quote').reply(200, { supported: 'sí' })

    const result = await new HttpShippingRepository(client).quote({
      country: 'ES',
      items: [{ productId: 'p-1', quantity: 1 }],
    })

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })
})
