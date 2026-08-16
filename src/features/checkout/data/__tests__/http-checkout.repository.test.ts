import { HttpCheckoutRepository } from '../repositories/http-checkout.repository'
import { makeClient } from '../testing/make-client'

const ORDER_OK = {
  id: 'o-1',
  orderNumber: 'NX-1001',
  status: 'PAID',
  paymentMethod: 'WALLET',
  currency: 'EUR',
  subtotal: '25.80',
  shipping: '4.20',
  tax: '6.30',
  total: '36.30',
  totalFormatted: '36,30 €',
  items: [],
}

const ORDER = {
  items: [{ productId: 'p-1', variantId: 'v-1', quantity: 2 }],
  shippingAddressId: 'a-1',
  paymentMethod: 'WALLET' as const,
  notes: 'Portal 2',
  couponCode: 'VERANO',
}

describe('HttpCheckoutRepository', () => {
  it('manda la clave de idempotencia en la cabecera', async () => {
    // Sin ella, un reintento tras un corte de conexión crea un segundo pedido y cobra dos veces.
    const { client, mock } = makeClient()
    let key: unknown = null
    mock.onPost('/me/orders/checkout').reply((config) => {
      key = config.headers?.['Idempotency-Key']
      return [200, ORDER_OK]
    })

    await new HttpCheckoutRepository(client).placeOrder(ORDER, 'cart-abc-2')

    expect(key).toBe('cart-abc-2')
  })

  it('repite la MISMA clave en dos intentos del mismo pedido', async () => {
    const { client, mock } = makeClient()
    const keys: unknown[] = []
    mock.onPost('/me/orders/checkout').reply((config) => {
      keys.push(config.headers?.['Idempotency-Key'])
      return [200, ORDER_OK]
    })
    const repository = new HttpCheckoutRepository(client)

    await repository.placeOrder(ORDER, 'cart-abc-2')
    await repository.placeOrder(ORDER, 'cart-abc-2')

    expect(keys).toEqual(['cart-abc-2', 'cart-abc-2'])
  })

  it('manda el pedido con la dirección, las líneas, el método y el cupón', async () => {
    const { client, mock } = makeClient()
    let body: unknown = null
    mock.onPost('/me/orders/checkout').reply((config) => {
      body = JSON.parse(config.data as string)
      return [200, ORDER_OK]
    })

    const result = await new HttpCheckoutRepository(client).placeOrder(ORDER, 'cart-abc-2')

    expect(body).toEqual({
      shippingAddressId: 'a-1',
      items: [{ productId: 'p-1', variantId: 'v-1', quantity: 2 }],
      notes: 'Portal 2',
      paymentMethod: 'WALLET',
      couponCode: 'VERANO',
    })
    expect(result.ok && result.value.id).toBe('o-1')
    expect(result.ok && result.value.totalFormatted).toBe('36,30 €')
  })

  it('recoge el enlace de aprobación si algún día llega con el pedido', async () => {
    const { client, mock } = makeClient()
    mock
      .onPost('/me/orders/checkout')
      .reply(200, { ...ORDER_OK, approveUrl: 'https://www.paypal.com/checkoutnow?token=1' })

    const result = await new HttpCheckoutRepository(client).placeOrder(ORDER, 'cart-abc-2')

    expect(result.ok && result.value.approvalUrl).toBe('https://www.paypal.com/checkoutnow?token=1')
  })

  it('no inventa enlace de aprobación cuando el backend no lo manda', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/orders/checkout').reply(200, ORDER_OK)

    const result = await new HttpCheckoutRepository(client).placeOrder(ORDER, 'cart-abc-2')

    expect(result.ok && result.value.approvalUrl).toBeUndefined()
  })

  it('traduce el rechazo del backend con su mensaje traducido', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/orders/checkout').reply(400, { message: 'Insufficient wallet balance' })

    const result = await new HttpCheckoutRepository(client).placeOrder(ORDER, 'cart-abc-2')

    expect(!result.ok && result.error.code).toBe('VALIDATION')
    expect(!result.ok && result.error.message).toBe('Insufficient wallet balance')
  })

  it('falla con CONTRACT si el pedido no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/orders/checkout').reply(200, { orderNumber: 'NX-1' })

    const result = await new HttpCheckoutRepository(client).placeOrder(ORDER, 'cart-abc-2')

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })
})
