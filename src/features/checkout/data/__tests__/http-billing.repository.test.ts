import { HttpBillingRepository } from '../repositories/http-billing.repository'
import { makeClient } from '../testing/make-client'

describe('HttpBillingRepository', () => {
  it('lee del backend la clave pública de la pasarela', async () => {
    // La clave no está en el código: cambia entre local, preproducción y producción.
    const { client, mock } = makeClient()
    mock.onGet('/me/billing/config').reply(200, { publishableKey: 'pk_test_123', enabled: true })

    const result = await new HttpBillingRepository(client).config()

    expect(result.ok && result.value).toEqual({ publishableKey: 'pk_test_123', enabled: true })
  })

  it('trata una clave en blanco como que no hay clave', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/billing/config').reply(200, { publishableKey: '  ', enabled: true })

    const result = await new HttpBillingRepository(client).config()

    expect(result.ok && result.value.publishableKey).toBeUndefined()
  })

  it('da el cobro con tarjeta por apagado si la respuesta no lo dice', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/billing/config').reply(200, {})

    const result = await new HttpBillingRepository(client).config()

    expect(result.ok && result.value.enabled).toBe(false)
  })

  it('abre el intento de guardado y devuelve su secreto', async () => {
    const { client, mock } = makeClient()
    let url = ''
    mock.onPost('/me/payment-methods/setup-intent').reply((config) => {
      url = config.url ?? ''
      return [200, { clientSecret: 'seti_1_secret_abc' }]
    })

    const result = await new HttpBillingRepository(client).createSetupIntent()

    expect(url).toBe('/me/payment-methods/setup-intent')
    expect(result.ok && result.value).toBe('seti_1_secret_abc')
  })

  it('falla con CONTRACT si el intento llega sin secreto', async () => {
    // Sin secreto no hay nada que confirmar: seguir daría por buena un alta que no existe.
    const { client, mock } = makeClient()
    mock.onPost('/me/payment-methods/setup-intent').reply(200, { clientSecret: '' })

    const result = await new HttpBillingRepository(client).createSetupIntent()

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('traduce el fallo del backend al abrir el intento', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/payment-methods/setup-intent').reply(400, { message: 'Facturación no activa' })

    const result = await new HttpBillingRepository(client).createSetupIntent()

    expect(!result.ok && result.error.message).toBe('Facturación no activa')
  })
})
