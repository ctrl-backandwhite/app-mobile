import { HttpPaymentMethodsRepository } from '../repositories/http-payment-methods.repository'
import { makeClient } from '../testing/make-client'

const METHODS = [
  { id: 'pm_1', type: 'CARD', brand: 'visa', last4: '4242', expMonth: 4, expYear: 2027, isDefault: true },
  { id: 'paypal:9', type: 'PAYPAL', paypalEmail: 'j***@dominio.com', isDefault: false },
]

describe('HttpPaymentMethodsRepository', () => {
  it('lee los métodos guardados del perfil', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/payment-methods').reply(200, METHODS)

    const result = await new HttpPaymentMethodsRepository(client).list()

    expect(result.ok && result.value).toHaveLength(2)
    expect(result.ok && result.value[0]?.last4).toBe('4242')
    expect(result.ok && result.value[1]?.paypalEmail).toBe('j***@dominio.com')
  })

  it('descarta un tipo de método que la app no sabe cobrar', async () => {
    // Enseñarlo llevaría a elegirlo y descubrir en el error que ese botón nunca iba a funcionar.
    const { client, mock } = makeClient()
    mock.onGet('/me/payment-methods').reply(200, [...METHODS, { id: 'sepa_1', type: 'SEPA' }])

    const result = await new HttpPaymentMethodsRepository(client).list()

    expect(result.ok && result.value.map((method) => method.id)).toEqual(['pm_1', 'paypal:9'])
  })

  it('cobra la tarjeta guardada contra el pedido, con clave de idempotencia propia', async () => {
    const { client, mock } = makeClient()
    let key: unknown = null
    let body: unknown = null
    mock.onPost('/me/orders/o-1/pay-saved-card').reply((config) => {
      key = config.headers?.['Idempotency-Key']
      body = JSON.parse(config.data as string)
      return [200, { status: 'succeeded', clientSecret: null, paymentId: 'pay-1' }]
    })

    const result = await new HttpPaymentMethodsRepository(client).chargeSavedCard('o-1', 'pm_1')

    expect(body).toEqual({ paymentMethodId: 'pm_1' })
    expect(key).toBe('savedcard-o-1-pm_1')
    expect(result.ok && result.value.status).toBe('succeeded')
  })

  it('lee como «falta autenticar» cualquier estado que no sea cobrado', async () => {
    const { client, mock } = makeClient()
    mock
      .onPost('/me/orders/o-1/pay-saved-card')
      .reply(200, { status: 'requires_action', clientSecret: 'cs_1', paymentId: 'pay-1' })

    const result = await new HttpPaymentMethodsRepository(client).chargeSavedCard('o-1', 'pm_1')

    expect(result.ok && result.value.status).toBe('requires_action')
    expect(result.ok && result.value.clientSecret).toBe('cs_1')
  })

  it('confirma el cobro con la ruta del pago', async () => {
    const { client, mock } = makeClient()
    let url = ''
    mock.onPost(/\/me\/orders\/.*\/confirm$/).reply((config) => {
      url = config.url ?? ''
      return [204]
    })

    const result = await new HttpPaymentMethodsRepository(client).confirmSavedCard('o-1', 'pay-1')

    expect(url).toBe('/me/orders/o-1/pay-saved-card/pay-1/confirm')
    expect(result.ok).toBe(true)
  })

  it('traduce el rechazo de la tarjeta con el mensaje del backend', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/orders/o-1/pay-saved-card').reply(400, { message: 'Tarjeta rechazada' })

    const result = await new HttpPaymentMethodsRepository(client).chargeSavedCard('o-1', 'pm_1')

    expect(!result.ok && result.error.message).toBe('Tarjeta rechazada')
  })

  it('falla con CONTRACT si la lista no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/payment-methods').reply(200, { items: [] })

    const result = await new HttpPaymentMethodsRepository(client).list()

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })
})
