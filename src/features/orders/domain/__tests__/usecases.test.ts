import { AppError } from '@core/errors/app-error'

import { FakeOrdersRepository, anOrder, anOrderDetail, aTracking } from '../testing/fake-orders-repository'
import { CancelOrder } from '../usecases/cancel-order'
import { GetOrderDetail } from '../usecases/get-order-detail'
import { GetOrderTracking } from '../usecases/get-order-tracking'
import { ListOrders } from '../usecases/list-orders'

describe('ListOrders', () => {
  it('devuelve el histórico del usuario', async () => {
    const repository = new FakeOrdersRepository({ orders: [anOrder({ orderNumber: 'NX-1' })] })

    const result = await new ListOrders(repository).execute()

    expect(result.ok && result.value[0]?.orderNumber).toBe('NX-1')
  })

  it('un histórico vacío no es un error', async () => {
    const repository = new FakeOrdersRepository({ orders: [] })

    const result = await new ListOrders(repository).execute()

    expect(result.ok && result.value).toEqual([])
  })

  it('propaga el error del repositorio', async () => {
    const repository = new FakeOrdersRepository({ error: new AppError('NETWORK', 'Sin conexión') })

    const result = await new ListOrders(repository).execute()

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})

describe('GetOrderDetail', () => {
  it('devuelve el detalle y pide el idioma indicado', async () => {
    const repository = new FakeOrdersRepository({ detail: anOrderDetail({ orderNumber: 'NX-7' }) })

    const result = await new GetOrderDetail(repository).execute('o-1', 'fr')

    expect(result.ok && result.value.orderNumber).toBe('NX-7')
    expect(repository.lastId).toBe('o-1')
    expect(repository.lastLang).toBe('fr')
  })

  it('el idioma por defecto es el español', async () => {
    const repository = new FakeOrdersRepository()

    await new GetOrderDetail(repository).execute('o-1')

    expect(repository.lastLang).toBe('es')
  })

  it('recorta los espacios del identificador', async () => {
    const repository = new FakeOrdersRepository()

    await new GetOrderDetail(repository).execute('  o-1  ')

    expect(repository.lastId).toBe('o-1')
  })

  it('un identificador vacío falla como NOT_FOUND sin llamar al backend', async () => {
    const repository = new FakeOrdersRepository()

    const result = await new GetOrderDetail(repository).execute('   ')

    expect(!result.ok && result.error.code).toBe('NOT_FOUND')
    expect(repository.lastId).toBeNull()
  })

  it('propaga el error del repositorio', async () => {
    const repository = new FakeOrdersRepository({ error: new AppError('NOT_FOUND', 'No existe') })

    const result = await new GetOrderDetail(repository).execute('o-9')

    expect(!result.ok && result.error.code).toBe('NOT_FOUND')
  })
})

describe('GetOrderTracking', () => {
  it('devuelve el seguimiento del pedido', async () => {
    const repository = new FakeOrdersRepository({ tracking: aTracking({ trackingNumber: 'YT-9' }) })

    const result = await new GetOrderTracking(repository).execute('o-1')

    expect(result.ok && result.value.trackingNumber).toBe('YT-9')
    expect(repository.lastId).toBe('o-1')
  })

  it('un identificador vacío falla como NOT_FOUND sin llamar al backend', async () => {
    const repository = new FakeOrdersRepository()

    const result = await new GetOrderTracking(repository).execute('  ')

    expect(!result.ok && result.error.code).toBe('NOT_FOUND')
    expect(repository.lastId).toBeNull()
  })

  it('propaga el error del repositorio', async () => {
    const repository = new FakeOrdersRepository({ error: new AppError('SERVER', 'Se ha roto') })

    const result = await new GetOrderTracking(repository).execute('o-1')

    expect(!result.ok && result.error.code).toBe('SERVER')
  })
})

describe('CancelOrder', () => {
  it('cancela y devuelve el pedido ya cancelado', async () => {
    const repository = new FakeOrdersRepository()

    const result = await new CancelOrder(repository).execute('o-1', 'es', true)

    expect(result.ok && result.value.status).toBe('CANCELLED')
    expect(repository.lastId).toBe('o-1')
  })

  it('por defecto reembolsa a la billetera, que es el destino inmediato', async () => {
    const repository = new FakeOrdersRepository()

    await new CancelOrder(repository).execute('o-1')

    expect(repository.lastLang).toBe('es')
    expect(repository.lastRefundToWallet).toBe(true)
  })

  it('respeta la elección del método original', async () => {
    const repository = new FakeOrdersRepository()

    await new CancelOrder(repository).execute('o-1', 'en', false)

    expect(repository.lastRefundToWallet).toBe(false)
  })

  it('un identificador vacío falla como NOT_FOUND sin llamar al backend', async () => {
    const repository = new FakeOrdersRepository()

    const result = await new CancelOrder(repository).execute('')

    expect(!result.ok && result.error.code).toBe('NOT_FOUND')
    expect(repository.lastId).toBeNull()
  })

  it('propaga el rechazo del backend', async () => {
    // El servidor tiene la última palabra: entre pintar el botón y pulsarlo el pedido pudo avanzar.
    const repository = new FakeOrdersRepository({
      error: new AppError('CONFLICT', 'El pedido ya no se puede cancelar'),
    })

    const result = await new CancelOrder(repository).execute('o-1')

    expect(!result.ok && result.error.code).toBe('CONFLICT')
  })
})
