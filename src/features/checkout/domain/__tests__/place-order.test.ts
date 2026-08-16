import { AppError } from '@core/errors/app-error'

import { CHECKOUT_MESSAGES } from '../policies/checkout-errors'
import { checkoutIdempotencyKey } from '../policies/idempotency'
import {
  aCheckoutItem,
  aDraft,
  anAddress,
  aPlacedOrder,
  aWalletBalance,
} from '../testing/checkout-builders'
import { FakeCheckoutRepository } from '../testing/fake-checkout-repository'
import { PlaceOrder } from '../usecases/place-order'

const ITEMS = [aCheckoutItem()]
const KEY = checkoutIdempotencyKey(ITEMS)

describe('PlaceOrder', () => {
  it('no tramita sin dirección', async () => {
    const repository = new FakeCheckoutRepository()

    const result = await new PlaceOrder(repository).execute({
      draft: { payment: { kind: 'WALLET' } },
      items: ITEMS,
      idempotencyKey: KEY,
    })

    expect(repository.calls).toBe(0)
    expect(!result.ok && result.error.message).toBe(CHECKOUT_MESSAGES.noAddress)
  })

  it('no tramita sin método de pago', async () => {
    const repository = new FakeCheckoutRepository()

    const result = await new PlaceOrder(repository).execute({
      draft: { address: anAddress() },
      items: ITEMS,
      idempotencyKey: KEY,
    })

    expect(repository.calls).toBe(0)
    expect(!result.ok && result.error.message).toBe(CHECKOUT_MESSAGES.noPayment)
  })

  it('no tramita una cesta vacía', async () => {
    const repository = new FakeCheckoutRepository()

    const result = await new PlaceOrder(repository).execute({
      draft: aDraft(),
      items: [],
      idempotencyKey: KEY,
    })

    expect(repository.calls).toBe(0)
    expect(!result.ok && result.error.message).toBe(CHECKOUT_MESSAGES.emptyCart)
  })

  it('avisa del saldo corto ANTES de llamar al backend', async () => {
    // Llamar igualmente dejaría un pedido pendiente que alguien tendría que cancelar a mano.
    const repository = new FakeCheckoutRepository()

    const result = await new PlaceOrder(repository).execute({
      draft: aDraft({ payment: { kind: 'WALLET' } }),
      items: ITEMS,
      idempotencyKey: KEY,
      wallet: aWalletBalance({ availableUsdCents: 100 }),
      requiredUsdCents: 2580,
    })

    expect(repository.calls).toBe(0)
    expect(!result.ok && result.error.code).toBe('VALIDATION')
    expect(!result.ok && result.error.message).toBe(CHECKOUT_MESSAGES.insufficientWallet)
  })

  it('no frena el pago con tarjeta aunque el monedero esté a cero', async () => {
    const repository = new FakeCheckoutRepository()

    const result = await new PlaceOrder(repository).execute({
      draft: aDraft({ payment: { kind: 'CARD', savedMethodId: 'pm_1' } }),
      items: ITEMS,
      idempotencyKey: KEY,
      wallet: aWalletBalance({ availableUsdCents: 0 }),
      requiredUsdCents: 2580,
    })

    expect(result.ok).toBe(true)
    expect(repository.calls).toBe(1)
  })

  it('manda las líneas, el destino, el método y el cupón que se han elegido', async () => {
    const repository = new FakeCheckoutRepository()

    await new PlaceOrder(repository).execute({
      draft: aDraft({
        address: anAddress({ id: 'a-9' }),
        payment: { kind: 'CARD', savedMethodId: 'pm_1' },
        couponCode: 'VERANO',
        notes: 'Portal 2',
      }),
      items: ITEMS,
      idempotencyKey: KEY,
    })

    expect(repository.lastOrder).toEqual({
      items: ITEMS,
      shippingAddressId: 'a-9',
      paymentMethod: 'CARD',
      notes: 'Portal 2',
      couponCode: 'VERANO',
    })
  })

  it('viaja siempre con la clave de idempotencia del intento', async () => {
    const repository = new FakeCheckoutRepository()
    const placeOrder = new PlaceOrder(repository)

    await placeOrder.execute({ draft: aDraft(), items: ITEMS, idempotencyKey: KEY })
    await placeOrder.execute({ draft: aDraft(), items: ITEMS, idempotencyKey: KEY })

    expect(repository.keys).toEqual([KEY, KEY])
  })

  it('devuelve el pedido creado', async () => {
    const repository = new FakeCheckoutRepository({ order: aPlacedOrder({ id: 'o-77' }) })

    const result = await new PlaceOrder(repository).execute({
      draft: aDraft(),
      items: ITEMS,
      idempotencyKey: KEY,
    })

    expect(result.ok && result.value.id).toBe('o-77')
  })

  it('propaga el fallo del backend', async () => {
    const repository = new FakeCheckoutRepository({ error: new AppError('NETWORK', 'Sin conexión') })

    const result = await new PlaceOrder(repository).execute({
      draft: aDraft(),
      items: ITEMS,
      idempotencyKey: KEY,
    })

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})
