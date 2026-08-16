import { fireEvent, screen, waitFor } from '@testing-library/react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import { CartLine } from '@features/cart/domain/entities/cart-line'
import { CHECKOUT_MESSAGES } from '@features/checkout/domain/policies/checkout-errors'
import { checkoutIdempotencyKey } from '@features/checkout/domain/policies/idempotency'
import {
  anAddress,
  aPaymentMethod,
  aPlacedOrder,
  aShippingQuote,
  aWalletBalance,
} from '@features/checkout/domain/testing/checkout-builders'

import { CheckoutScreen } from '../screens/CheckoutScreen'
import { renderCheckout } from '../testing/render-checkout'

const LINE: CartLine = {
  productId: 'p-1',
  slug: 'camisa-lino',
  title: 'Camisa de lino',
  quantity: 2,
}

const EXPECTED_KEY = checkoutIdempotencyKey([{ productId: 'p-1', quantity: 2 }])

function deps(overrides: Record<string, unknown> = {}) {
  return {
    loadCart: { execute: jest.fn().mockResolvedValue([LINE]) },
    clearCart: { execute: jest.fn().mockResolvedValue(undefined) },
    listAddresses: { execute: jest.fn().mockResolvedValue(ok([anAddress()])) },
    listPaymentMethods: { execute: jest.fn().mockResolvedValue(ok([])) },
    getWalletBalance: { execute: jest.fn().mockResolvedValue(ok(aWalletBalance())) },
    quoteShipping: { execute: jest.fn().mockResolvedValue(ok(aShippingQuote())) },
    placeOrder: { execute: jest.fn().mockResolvedValue(ok(aPlacedOrder())) },
    payWithSavedCard: { execute: jest.fn().mockResolvedValue(ok({ status: 'paid' })) },
    ...overrides,
  }
}

async function pressConfirm(): Promise<void> {
  await fireEvent.press(await screen.findByText('Confirmar pedido'))
}

describe('CheckoutScreen', () => {
  it('pinta los importes que devuelve el backend, sin sumar nada', async () => {
    await renderCheckout(<CheckoutScreen />, deps())

    // Subtotal, envío, impuesto y total salen tal cual de la cotización.
    expect(await screen.findByText('25,80 €')).toBeTruthy()
    expect(screen.getByText('4,20 €')).toBeTruthy()
    expect(screen.getByText('36,30 €')).toBeTruthy()
    expect(screen.getByText('Impuestos (21 %)')).toBeTruthy()
  })

  it('propone la dirección predeterminada y cotiza su destino', async () => {
    const container = deps({
      listAddresses: {
        execute: jest.fn().mockResolvedValue(
          ok([anAddress({ id: 'a-1', isDefault: false }), anAddress({ id: 'a-2', isDefault: true, country: 'FR' })]),
        ),
      },
    })
    await renderCheckout(<CheckoutScreen />, container)

    await waitFor(() =>
      expect(container.quoteShipping.execute).toHaveBeenCalledWith(
        expect.objectContaining({ country: 'FR', items: [{ productId: 'p-1', variantId: undefined, quantity: 2 }] }),
      ),
    )
  })

  it('no deja confirmar sin dirección', async () => {
    const container = deps({ listAddresses: { execute: jest.fn().mockResolvedValue(ok([])) } })
    await renderCheckout(<CheckoutScreen />, container)

    expect(await screen.findByText(CHECKOUT_MESSAGES.noAddress)).toBeTruthy()
    await pressConfirm()

    expect(container.placeOrder.execute).not.toHaveBeenCalled()
  })

  it('no deja confirmar sin método de pago', async () => {
    // Sin métodos guardados se propone el monedero; si tampoco hay saldo consultable, sigue habiendo
    // elección, así que el caso sin pago se fuerza dejando la lista de métodos sin resolver.
    const container = deps({
      listPaymentMethods: { execute: jest.fn(() => new Promise(() => undefined)) },
    })
    await renderCheckout(<CheckoutScreen />, container)

    expect(await screen.findByText(CHECKOUT_MESSAGES.noPayment)).toBeTruthy()
    await pressConfirm()

    expect(container.placeOrder.execute).not.toHaveBeenCalled()
  })

  it('avisa del saldo corto y no llama al backend', async () => {
    const container = deps({
      getWalletBalance: { execute: jest.fn().mockResolvedValue(ok(aWalletBalance({ availableUsdCents: 10 }))) },
    })
    await renderCheckout(<CheckoutScreen />, container)

    expect(await screen.findAllByText(CHECKOUT_MESSAGES.insufficientWallet)).not.toHaveLength(0)
    await pressConfirm()

    expect(container.placeOrder.execute).not.toHaveBeenCalled()
  })

  it('tramita con la clave de idempotencia derivada de la cesta', async () => {
    const container = deps()
    await renderCheckout(<CheckoutScreen />, container)

    await pressConfirm()

    await waitFor(() =>
      expect(container.placeOrder.execute).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: EXPECTED_KEY }),
      ),
    )
  })

  it('reintenta con la MISMA clave tras un fallo del backend', async () => {
    // Es lo que evita el doble cobro cuando la conexión se corta y la persona vuelve a pulsar.
    const container = deps({
      placeOrder: { execute: jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'Sin conexión'))) },
    })
    await renderCheckout(<CheckoutScreen />, container)

    await pressConfirm()
    await screen.findByText('Sin conexión')
    await pressConfirm()

    const keys = container.placeOrder.execute.mock.calls.map(
      (call: [{ idempotencyKey: string }]) => call[0].idempotencyKey,
    )
    expect(keys).toHaveLength(2)
    expect(keys[0]).toBe(keys[1])
  })

  it('no vacía la cesta si la tramitación falla', async () => {
    const container = deps({
      placeOrder: {
        execute: jest.fn().mockResolvedValue(err(new AppError('VALIDATION', 'Insufficient wallet balance'))),
      },
    })
    await renderCheckout(<CheckoutScreen />, container)

    await pressConfirm()

    expect(await screen.findByText(CHECKOUT_MESSAGES.insufficientWallet)).toBeTruthy()
    expect(container.clearCart.execute).not.toHaveBeenCalled()
    expect(global.routerMock.replace).not.toHaveBeenCalled()
  })

  it('vacía la cesta y abre el pedido cuando la compra sale bien', async () => {
    const container = deps({
      placeOrder: { execute: jest.fn().mockResolvedValue(ok(aPlacedOrder({ id: 'o-77' }))) },
    })
    await renderCheckout(<CheckoutScreen />, container)

    await pressConfirm()

    await waitFor(() => expect(container.clearCart.execute).toHaveBeenCalled())
    expect(global.routerMock.replace).toHaveBeenCalledWith('/orders/o-77')
  })

  it('cobra la tarjeta guardada DESPUÉS de crear el pedido', async () => {
    const container = deps({
      listPaymentMethods: { execute: jest.fn().mockResolvedValue(ok([aPaymentMethod({ id: 'pm_9' })])) },
      placeOrder: { execute: jest.fn().mockResolvedValue(ok(aPlacedOrder({ id: 'o-9', status: 'PENDING' }))) },
    })
    await renderCheckout(<CheckoutScreen />, container)

    expect(await screen.findByText('VISA •••• 4242')).toBeTruthy()
    await pressConfirm()

    await waitFor(() => expect(container.payWithSavedCard.execute).toHaveBeenCalledWith('o-9', 'pm_9'))
    expect(container.placeOrder.execute).toHaveBeenCalledWith(
      expect.objectContaining({ draft: expect.objectContaining({ payment: { kind: 'CARD', savedMethodId: 'pm_9' } }) }),
    )
  })

  it('no vacía la cesta si el cobro con tarjeta falla', async () => {
    const container = deps({
      listPaymentMethods: { execute: jest.fn().mockResolvedValue(ok([aPaymentMethod({ id: 'pm_9' })])) },
      payWithSavedCard: {
        execute: jest.fn().mockResolvedValue(err(new AppError('VALIDATION', 'Tarjeta rechazada'))),
      },
    })
    await renderCheckout(<CheckoutScreen />, container)

    await pressConfirm()

    expect(await screen.findByText('Tarjeta rechazada')).toBeTruthy()
    expect(container.clearCart.execute).not.toHaveBeenCalled()
  })

  it('explica que el 3-D Secure no se puede completar en la app y deja la cesta intacta', async () => {
    const container = deps({
      listPaymentMethods: { execute: jest.fn().mockResolvedValue(ok([aPaymentMethod({ id: 'pm_9' })])) },
      payWithSavedCard: {
        execute: jest.fn().mockResolvedValue(ok({ status: 'needs-authentication', clientSecret: 'cs_1' })),
      },
    })
    await renderCheckout(<CheckoutScreen />, container)

    await pressConfirm()

    expect(await screen.findByText(CHECKOUT_MESSAGES.cardAuthentication)).toBeTruthy()
    expect(container.clearCart.execute).not.toHaveBeenCalled()
  })

  it('impide comprar hacia un país sin cobertura', async () => {
    const container = deps({
      quoteShipping: { execute: jest.fn().mockResolvedValue(ok(aShippingQuote({ supported: false }))) },
    })
    await renderCheckout(<CheckoutScreen />, container)

    expect(await screen.findByText('Todavía no enviamos a ese país.')).toBeTruthy()
    await pressConfirm()

    expect(container.placeOrder.execute).not.toHaveBeenCalled()
  })

  it('impide comprar cuando el destino supera su límite de importación', async () => {
    const container = deps({
      quoteShipping: {
        execute: jest.fn().mockResolvedValue(ok(aShippingQuote({ customsBlocked: true, customsLimit: '150 EUR' }))),
      },
    })
    await renderCheckout(<CheckoutScreen />, container)

    expect(await screen.findByText(/límite de importación del destino \(150 EUR\)/)).toBeTruthy()
    await pressConfirm()

    expect(container.placeOrder.execute).not.toHaveBeenCalled()
  })

  it('aplica el cupón y solo manda al backend el que la cotización acepta', async () => {
    const container = deps({
      quoteShipping: { execute: jest.fn().mockResolvedValue(ok(aShippingQuote({ couponCode: 'VERANO' }))) },
    })
    await renderCheckout(<CheckoutScreen />, container)

    await fireEvent.changeText(await screen.findByLabelText('Cupón'), 'verano')
    await fireEvent.press(screen.getByText('Aplicar cupón'))

    await waitFor(() =>
      expect(container.quoteShipping.execute).toHaveBeenCalledWith(
        expect.objectContaining({ couponCode: 'VERANO' }),
      ),
    )
    expect(await screen.findByText('Cupón VERANO aplicado.')).toBeTruthy()
  })

  it('enseña el motivo cuando el cupón se rechaza', async () => {
    const container = deps({
      quoteShipping: {
        execute: jest.fn().mockResolvedValue(ok(aShippingQuote({ couponError: 'Ese cupón ha caducado.' }))),
      },
    })
    await renderCheckout(<CheckoutScreen />, container)

    expect(await screen.findByText('Ese cupón ha caducado.')).toBeTruthy()
  })

  it('lleva a dar de alta una dirección', async () => {
    await renderCheckout(<CheckoutScreen />, deps())

    await fireEvent.press(await screen.findByLabelText('Añadir una dirección de envío'))

    expect(global.routerMock.push).toHaveBeenCalledWith('/checkout/address')
  })

  it('lleva a dar de alta una tarjeta', async () => {
    await renderCheckout(<CheckoutScreen />, deps())

    await fireEvent.press(await screen.findByLabelText('Añadir una tarjeta'))

    expect(global.routerMock.push).toHaveBeenCalledWith('/checkout/add-card')
  })

  it('permite pagar con PayPal y confirma contra el backend al volver', async () => {
    const payWithProvider = { execute: jest.fn().mockResolvedValue(ok('paid')) }
    const container = deps({ payWithProvider })
    await renderCheckout(<CheckoutScreen />, container)

    await fireEvent.press(await screen.findByLabelText('Pagar con PayPal'))
    await fireEvent.press(screen.getByText('Confirmar pedido'))

    await waitFor(() => expect(payWithProvider.execute).toHaveBeenCalledWith(expect.any(String), 'PAYPAL'))
    // Solo se vacía la cesta cuando el pago está confirmado por el servidor.
    await waitFor(() => expect(container.clearCart.execute).toHaveBeenCalled())
  })

  it('no vacía la cesta si se cancela el pago en PayPal', async () => {
    // Cancelar deja el pedido pendiente: la cesta tiene que seguir ahí para poder reintentar.
    const payWithProvider = { execute: jest.fn().mockResolvedValue(ok('cancelled')) }
    const container = deps({ payWithProvider })
    await renderCheckout(<CheckoutScreen />, container)

    await fireEvent.press(await screen.findByLabelText('Pagar con PayPal'))
    await fireEvent.press(screen.getByText('Confirmar pedido'))

    await waitFor(() => expect(payWithProvider.execute).toHaveBeenCalled())
    expect(container.clearCart.execute).not.toHaveBeenCalled()
  })

  it('avisa cuando la cesta está vacía', async () => {
    const container = deps({ loadCart: { execute: jest.fn().mockResolvedValue([]) } })
    await renderCheckout(<CheckoutScreen />, container)

    expect(await screen.findByText(/cesta está vacía/)).toBeTruthy()
    await pressConfirm()

    expect(container.placeOrder.execute).not.toHaveBeenCalled()
  })
})
