import { fireEvent, render, screen } from '@testing-library/react-native'

import { CartLineRow } from '../CartLineRow'
import { aLine, aQuoteLine } from '../testing/cart-fixture'

// En @testing-library/react-native 14 tanto `render` como `fireEvent` son asíncronos: envuelven
// `act` internamente y hay que esperarlos para que el árbol quede actualizado.
describe('CartLineRow', () => {
  const noop = {
    onQuantityChange: jest.fn(),
    onRemove: jest.fn(),
    onSaveForLater: jest.fn(),
  }

  it('pinta el título, la cantidad y el importe que manda el presupuesto', async () => {
    await render(<CartLineRow line={aLine()} quoteLine={aQuoteLine()} {...noop} />)

    expect(screen.getByText('Chaqueta cortavientos impermeable')).toBeOnTheScreen()
    expect(screen.getByText('2')).toBeOnTheScreen()
    expect(screen.getByText('49,80 €')).toBeOnTheScreen()
  })

  it('pinta la etiqueta de la variante junto al sku', async () => {
    await render(<CartLineRow line={aLine()} quoteLine={aQuoteLine()} {...noop} />)

    expect(screen.getByText('Color: Negro / Talla: M · SKU NX-001')).toBeOnTheScreen()
  })

  it('omite el renglón de la variante cuando la línea no trae ni etiqueta ni sku', async () => {
    await render(
      <CartLineRow
        line={aLine({ variantLabel: undefined, sku: undefined })}
        quoteLine={aQuoteLine()}
        {...noop}
      />,
    )

    expect(screen.queryByText('Color: Negro / Talla: M · SKU NX-001')).toBeNull()
    expect(screen.getByText('Chaqueta cortavientos impermeable')).toBeOnTheScreen()
  })

  // El precio lo dice el backend. Si el presupuesto aún no ha llegado, la fila deja el hueco: un
  // importe calculado en la app dejaría de coincidir con el cobro en cuanto cambie el margen.
  it('sin presupuesto deja un hueco en vez de inventar un precio', async () => {
    await render(<CartLineRow line={aLine()} {...noop} />)

    expect(screen.getByTestId('cart-line-amount')).toHaveTextContent('—')
    expect(screen.queryByText('49,80 €')).toBeNull()
  })

  it('deja el hueco también si el presupuesto llega sin importe de línea', async () => {
    await render(
      <CartLineRow
        line={aLine()}
        quoteLine={aQuoteLine({ lineTotalFormatted: undefined })}
        {...noop}
      />,
    )

    expect(screen.getByTestId('cart-line-amount')).toHaveTextContent('—')
  })

  it('avisa con la línea y la nueva cantidad al sumar una unidad', async () => {
    const onQuantityChange = jest.fn()
    const line = aLine()
    await render(
      <CartLineRow
        line={line}
        quoteLine={aQuoteLine()}
        onQuantityChange={onQuantityChange}
        onRemove={jest.fn()}
        onSaveForLater={jest.fn()}
      />,
    )

    await fireEvent.press(screen.getByLabelText('Añadir una unidad'))

    expect(onQuantityChange).toHaveBeenCalledWith(line, 3)
  })

  it('no baja del pedido mínimo de la línea', async () => {
    const onQuantityChange = jest.fn()
    await render(
      <CartLineRow
        line={aLine({ quantity: 5, moq: 5 })}
        quoteLine={aQuoteLine()}
        onQuantityChange={onQuantityChange}
        onRemove={jest.fn()}
        onSaveForLater={jest.fn()}
      />,
    )

    await fireEvent.press(screen.getByLabelText('Quitar una unidad'))

    expect(onQuantityChange).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Quitar una unidad')).toBeDisabled()
  })

  it('sin pedido mínimo declarado el suelo es una unidad', async () => {
    const onQuantityChange = jest.fn()
    await render(
      <CartLineRow
        line={aLine({ quantity: 1 })}
        quoteLine={aQuoteLine()}
        onQuantityChange={onQuantityChange}
        onRemove={jest.fn()}
        onSaveForLater={jest.fn()}
      />,
    )

    await fireEvent.press(screen.getByLabelText('Quitar una unidad'))

    expect(onQuantityChange).not.toHaveBeenCalled()
  })

  it('avisa con la línea correcta al quitarla de la cesta', async () => {
    const onRemove = jest.fn()
    const line = aLine()
    await render(
      <CartLineRow
        line={line}
        quoteLine={aQuoteLine()}
        onQuantityChange={jest.fn()}
        onRemove={onRemove}
        onSaveForLater={jest.fn()}
      />,
    )

    await fireEvent.press(
      screen.getByLabelText('Quitar Chaqueta cortavientos impermeable de la cesta'),
    )

    expect(onRemove).toHaveBeenCalledWith(line)
  })

  it('avisa con la línea correcta al guardarla para más tarde', async () => {
    const onSaveForLater = jest.fn()
    const line = aLine()
    await render(
      <CartLineRow
        line={line}
        quoteLine={aQuoteLine()}
        onQuantityChange={jest.fn()}
        onRemove={jest.fn()}
        onSaveForLater={onSaveForLater}
      />,
    )

    await fireEvent.press(
      screen.getByLabelText('Guardar Chaqueta cortavientos impermeable para más tarde'),
    )

    expect(onSaveForLater).toHaveBeenCalledWith(line)
  })

  it('mantiene el hueco de la miniatura cuando la línea no trae imagen', async () => {
    await render(
      <CartLineRow line={aLine({ image: undefined })} quoteLine={aQuoteLine()} {...noop} />,
    )

    expect(screen.getByTestId('cart-line-p-1-v-1')).toBeOnTheScreen()
    expect(screen.getByText('Chaqueta cortavientos impermeable')).toBeOnTheScreen()
  })

  it('identifica la fila por producto cuando la línea no tiene variante', async () => {
    await render(
      <CartLineRow
        line={aLine({ variantId: undefined })}
        quoteLine={aQuoteLine()}
        {...noop}
      />,
    )

    expect(screen.getByTestId('cart-line-p-1')).toBeOnTheScreen()
  })
})
