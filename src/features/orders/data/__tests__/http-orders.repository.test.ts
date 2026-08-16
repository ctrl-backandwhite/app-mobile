import MockAdapter from 'axios-mock-adapter'

import { HttpClient } from '@core/http/http-client'

import { HttpOrdersRepository } from '../repositories/http-orders.repository'

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

const ROW = {
  id: 'o-1',
  orderNumber: 'NX-2026-0001',
  status: 'PAID',
  paymentMethod: 'CARD',
  totalCents: 12990,
  totalFormatted: '129,90 €',
  currency: 'EUR',
  itemCount: 2,
  placedAt: '2026-08-01T10:00:00Z',
}

const DETAIL = {
  id: 'o-1',
  orderNumber: 'NX-2026-0001',
  externalOrderId: 'YT-1',
  status: 'SHIPPED',
  paymentMethod: 'WALLET',
  currency: 'EUR',
  subtotal: '119.90',
  shipping: '10.00',
  tax: '0.00',
  total: '129.90',
  discount: '0.00',
  subtotalFormatted: '119,90 €',
  shippingFormatted: '10,00 €',
  taxFormatted: '0,00 €',
  totalFormatted: '129,90 €',
  discountFormatted: '0,00 €',
  shippingAddress: {
    fullName: 'Ana Ruiz',
    phone: '+34600000000',
    email: 'ana@example.com',
    line1: 'Gran Vía 2',
    line2: null,
    city: 'Madrid',
    state: 'Madrid',
    postalCode: '28013',
    country: 'ES',
  },
  billingAddress: null,
  notes: 'Dejar en portería',
  trackingCarrier: 'YunExpress',
  trackingNumber: 'YT123456789',
  placedAt: '2026-08-01T10:00:00Z',
  shippedAt: '2026-08-02T08:00:00Z',
  items: [
    {
      id: 'li-1',
      productId: 'p-1',
      variantId: 'v-1',
      productTitle: 'Camisa de lino',
      variantName: 'Azul / M',
      imageUrl: 'https://cdn.nx036.com/p-1.jpg',
      quantity: 2,
      unitPrice: '64.95',
      lineTotal: '129.90',
      unitPriceFormatted: '64,95 €',
      lineTotalFormatted: '129,90 €',
      supplierName: 'Proveedor',
    },
  ],
}

const TRACKING = {
  status: 'SHIPPED',
  carrier: 'YunExpress',
  trackingNumber: 'YT123456789',
  estimatedDeliveryAt: '2026-08-10T00:00:00Z',
  lastTrackedAt: '2026-08-03T09:00:00Z',
  events: [
    {
      status: 'ACCEPTED',
      description: 'Admitido en origen',
      location: 'Shenzhen',
      source: 'CARRIER',
      occurredAt: '2026-08-02T08:00:00Z',
    },
  ],
  shipments: [
    {
      sequenceNo: 1,
      carrier: 'YunExpress',
      trackingNumber: 'YT123456789',
      status: 'IN_TRANSIT',
      weightGrams: 1200,
      estimatedDeliveryAt: '2026-08-10T00:00:00Z',
      events: [{ status: 'IN_TRANSIT', occurredAt: '2026-08-03T09:00:00Z' }],
    },
  ],
}

describe('HttpOrdersRepository', () => {
  it('devuelve el histórico ya mapeado al dominio', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/orders').reply(200, [ROW])
    const repository = new HttpOrdersRepository(client)

    const result = await repository.list()

    expect(result.ok && result.value).toHaveLength(1)
    expect(result.ok && result.value[0]?.orderNumber).toBe('NX-2026-0001')
    expect(result.ok && result.value[0]?.totalFormatted).toBe('129,90 €')
    expect(result.ok && result.value[0]?.itemCount).toBe(2)
    expect(result.ok && result.value[0]?.paymentMethod).toBe('CARD')
  })

  it('no recoge el importe en céntimos, solo el ya formateado', async () => {
    // La app no convierte ni da formato a importes: pintar `totalCents` exigiría elegir divisa aquí.
    const { client, mock } = makeClient()
    mock.onGet('/me/orders').reply(200, [ROW])
    const repository = new HttpOrdersRepository(client)

    const result = await repository.list()

    expect(result.ok && result.value[0]).not.toHaveProperty('totalCents')
  })

  it('un histórico vacío no es un error', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/orders').reply(200, [])
    const repository = new HttpOrdersRepository(client)

    const result = await repository.list()

    expect(result.ok && result.value).toEqual([])
  })

  it('tolera un pedido sin importe formateado ni fechas de envío, y un campo desconocido', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/orders').reply(200, [
      {
        id: 'o-2',
        orderNumber: 'NX-2026-0002',
        status: 'PENDING',
        placedAt: '2026-08-04T10:00:00Z',
        campoNuevoDelServidor: true,
      },
    ])
    const repository = new HttpOrdersRepository(client)

    const result = await repository.list()

    expect(result.ok && result.value[0]?.totalFormatted).toBeUndefined()
    expect(result.ok && result.value[0]?.itemCount).toBe(0)
    expect(result.ok && result.value[0]?.currency).toBe('')
    expect(result.ok && result.value[0]?.shippedAt).toBeUndefined()
  })

  it('traduce un fallo de red del histórico a NETWORK', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/orders').networkError()
    const repository = new HttpOrdersRepository(client)

    const result = await repository.list()

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })

  it('falla con CONTRACT si el histórico no es una lista', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/orders').reply(200, { items: [ROW] })
    const repository = new HttpOrdersRepository(client)

    const result = await repository.list()

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('recupera el detalle con líneas, dirección e importes formateados', async () => {
    const { client, mock } = makeClient()
    let params: Record<string, unknown> = {}
    mock.onGet('/me/orders/o-1').reply((config) => {
      params = (config.params ?? {}) as Record<string, unknown>
      return [200, DETAIL]
    })
    const repository = new HttpOrdersRepository(client)

    const result = await repository.detail('o-1', 'fr')

    expect(params).toEqual({ lang: 'fr' })
    expect(result.ok && result.value.status).toBe('SHIPPED')
    expect(result.ok && result.value.totalFormatted).toBe('129,90 €')
    expect(result.ok && result.value.shippingFormatted).toBe('10,00 €')
    expect(result.ok && result.value.shippingAddress?.city).toBe('Madrid')
    // El backend manda `null` para la segunda línea, no ausencia de campo.
    expect(result.ok && result.value.shippingAddress?.line2).toBeUndefined()
    expect(result.ok && result.value.items[0]?.productTitle).toBe('Camisa de lino')
    expect(result.ok && result.value.items[0]?.lineTotalFormatted).toBe('129,90 €')
    expect(result.ok && result.value.items[0]?.variantName).toBe('Azul / M')
    expect(result.ok && result.value.trackingNumber).toBe('YT123456789')
  })

  it('descarta los importes crudos del detalle y deja solo los formateados', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/orders/o-1').reply(200, DETAIL)
    const repository = new HttpOrdersRepository(client)

    const result = await repository.detail('o-1', 'es')

    expect(result.ok && result.value).not.toHaveProperty('total')
    expect(result.ok && result.value.items[0]).not.toHaveProperty('unitPrice')
  })

  it('tolera un detalle sin líneas, sin dirección y sin importes', async () => {
    const { client, mock } = makeClient()
    mock
      .onGet('/me/orders/o-3')
      .reply(200, { id: 'o-3', orderNumber: 'NX-3', status: 'PENDING' })
    const repository = new HttpOrdersRepository(client)

    const result = await repository.detail('o-3', 'es')

    expect(result.ok && result.value.items).toEqual([])
    expect(result.ok && result.value.shippingAddress).toBeUndefined()
    expect(result.ok && result.value.totalFormatted).toBeUndefined()
  })

  it('traduce un 404 del detalle a NOT_FOUND', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/orders/o-9').reply(404, { message: 'Pedido no encontrado' })
    const repository = new HttpOrdersRepository(client)

    const result = await repository.detail('o-9', 'es')

    expect(!result.ok && result.error.code).toBe('NOT_FOUND')
    expect(!result.ok && result.error.message).toBe('Pedido no encontrado')
  })

  it('falla con CONTRACT si el detalle no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/orders/o-1').reply(200, { id: 'o-1' })
    const repository = new HttpOrdersRepository(client)

    const result = await repository.detail('o-1', 'es')

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('recupera el seguimiento con sus eventos y sus bultos', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/orders/o-1/tracking').reply(200, TRACKING)
    const repository = new HttpOrdersRepository(client)

    const result = await repository.tracking('o-1')

    expect(result.ok && result.value.trackingNumber).toBe('YT123456789')
    expect(result.ok && result.value.events[0]?.description).toBe('Admitido en origen')
    expect(result.ok && result.value.events[0]?.location).toBe('Shenzhen')
    expect(result.ok && result.value.shipments[0]?.weightGrams).toBe(1200)
    expect(result.ok && result.value.shipments[0]?.events[0]?.status).toBe('IN_TRANSIT')
  })

  it('un pedido sin movimientos devuelve listas vacías, no un error', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/orders/o-2/tracking').reply(200, {})
    const repository = new HttpOrdersRepository(client)

    const result = await repository.tracking('o-2')

    expect(result.ok && result.value.events).toEqual([])
    expect(result.ok && result.value.shipments).toEqual([])
    expect(result.ok && result.value.trackingNumber).toBeUndefined()
  })

  it('traduce un 404 del seguimiento a NOT_FOUND', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/orders/o-9/tracking').reply(404, {})
    const repository = new HttpOrdersRepository(client)

    const result = await repository.tracking('o-9')

    expect(!result.ok && result.error.code).toBe('NOT_FOUND')
  })

  it('falla con CONTRACT si el seguimiento no es un objeto', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/orders/o-1/tracking').reply(200, [])
    const repository = new HttpOrdersRepository(client)

    const result = await repository.tracking('o-1')

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('cancela mandando idioma y destino del reembolso como parámetros', async () => {
    const { client, mock } = makeClient()
    let params: Record<string, unknown> = {}
    mock.onPost('/me/orders/o-1/cancel').reply((config) => {
      params = (config.params ?? {}) as Record<string, unknown>
      return [200, { ...DETAIL, status: 'CANCELLED', cancelledAt: '2026-08-05T10:00:00Z' }]
    })
    const repository = new HttpOrdersRepository(client)

    const result = await repository.cancel('o-1', 'es', false)

    expect(params).toEqual({ lang: 'es', refundToWallet: false })
    expect(result.ok && result.value.status).toBe('CANCELLED')
    expect(result.ok && result.value.cancelledAt).toBe('2026-08-05T10:00:00Z')
  })

  it('traduce el rechazo del backend a CONFLICT', async () => {
    // Entre pintar el botón y pulsarlo el pedido pudo avanzar: el servidor tiene la última palabra.
    const { client, mock } = makeClient()
    mock.onPost('/me/orders/o-1/cancel').reply(409, {
      code: 'ORDER_NOT_CANCELLABLE',
      message: 'El pedido ya no se puede cancelar',
    })
    const repository = new HttpOrdersRepository(client)

    const result = await repository.cancel('o-1', 'es', true)

    expect(!result.ok && result.error.code).toBe('CONFLICT')
    expect(!result.ok && result.error.message).toBe('El pedido ya no se puede cancelar')
  })

  it('falla con CONTRACT si el pedido cancelado no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/orders/o-1/cancel').reply(200, { estado: 'ok' })
    const repository = new HttpOrdersRepository(client)

    const result = await repository.cancel('o-1', 'es', true)

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('escapa el identificador para que no cambie la ruta', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/orders/o%2F..%2Fadmin').reply(200, DETAIL)
    const repository = new HttpOrdersRepository(client)

    const result = await repository.detail('o/../admin', 'es')

    expect(result.ok).toBe(true)
  })
})
