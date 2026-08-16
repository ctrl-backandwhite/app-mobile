import { fireEvent, render, screen } from '@testing-library/react-native'

import { CartSummary } from '../CartSummary'
import { aQuote } from '../testing/cart-fixture'

describe('CartSummary', () => {
  it('pinta el subtotal formateado por el backend y las unidades', async () => {
    await render(<CartSummary quote={aQuote()} unitCount={3} onCheckout={jest.fn()} />)

    expect(screen.getByText('49,80 €')).toBeOnTheScreen()
    expect(screen.getByText('3 unidades')).toBeOnTheScreen()
  })

  it('pone la unidad en singular cuando solo hay una', async () => {
    await render(<CartSummary quote={aQuote()} unitCount={1} onCheckout={jest.fn()} />)

    expect(screen.getByText('1 unidad')).toBeOnTheScreen()
  })

  it('tramita el pedido al pulsar el botón', async () => {
    const onCheckout = jest.fn()
    await render(<CartSummary quote={aQuote()} unitCount={2} onCheckout={onCheckout} />)

    await fireEvent.press(screen.getByText('Tramitar pedido'))

    expect(onCheckout).toHaveBeenCalledTimes(1)
  })

  // Sin presupuesto no hay total que confirmar: dejar tramitar llevaría a pagar un importe que la
  // app aún desconoce.
  it('sin presupuesto deja el subtotal en blanco y el botón inerte', async () => {
    const onCheckout = jest.fn()
    await render(<CartSummary unitCount={2} onCheckout={onCheckout} />)

    expect(screen.getByTestId('cart-summary-subtotal')).toHaveTextContent('—')
    expect(screen.getByRole('button')).toBeDisabled()

    await fireEvent.press(screen.getByText('Tramitar pedido'))

    expect(onCheckout).not.toHaveBeenCalled()
  })

  it('también queda inerte si el presupuesto llega sin subtotal', async () => {
    const onCheckout = jest.fn()
    await render(
      <CartSummary
        quote={aQuote({ subtotalFormatted: undefined })}
        unitCount={2}
        onCheckout={onCheckout}
      />,
    )

    await fireEvent.press(screen.getByText('Tramitar pedido'))

    expect(onCheckout).not.toHaveBeenCalled()
    expect(screen.getByTestId('cart-summary-subtotal')).toHaveTextContent('—')
  })

  it('respeta el bloqueo pedido desde fuera aunque haya presupuesto', async () => {
    const onCheckout = jest.fn()
    await render(
      <CartSummary quote={aQuote()} unitCount={2} onCheckout={onCheckout} checkoutDisabled />,
    )

    await fireEvent.press(screen.getByText('Tramitar pedido'))

    expect(onCheckout).not.toHaveBeenCalled()
    expect(screen.getByText('49,80 €')).toBeOnTheScreen()
  })
})
