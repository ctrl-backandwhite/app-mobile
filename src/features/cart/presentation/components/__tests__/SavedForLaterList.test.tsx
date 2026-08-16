import { fireEvent, render, screen } from '@testing-library/react-native'

import { SavedForLaterList } from '../SavedForLaterList'
import { aLine } from '../testing/cart-fixture'

describe('SavedForLaterList', () => {
  it('pinta el título, el recuento y cada línea guardada', async () => {
    await render(
      <SavedForLaterList
        lines={[aLine(), aLine({ productId: 'p-2', variantId: undefined, title: 'Gorra de lona' })]}
        onMoveToCart={jest.fn()}
        onRemove={jest.fn()}
      />,
    )

    expect(screen.getByText('Guardado para más tarde')).toBeOnTheScreen()
    expect(screen.getByText('(2)')).toBeOnTheScreen()
    expect(screen.getByText('Chaqueta cortavientos impermeable')).toBeOnTheScreen()
    expect(screen.getByText('Gorra de lona')).toBeOnTheScreen()
  })

  it('avisa con la línea correcta al moverla a la cesta', async () => {
    const onMoveToCart = jest.fn()
    const second = aLine({ productId: 'p-2', variantId: undefined, title: 'Gorra de lona' })
    await render(
      <SavedForLaterList lines={[aLine(), second]} onMoveToCart={onMoveToCart} onRemove={jest.fn()} />,
    )

    await fireEvent.press(screen.getByLabelText('Mover Gorra de lona a la cesta'))

    expect(onMoveToCart).toHaveBeenCalledWith(second)
  })

  it('avisa con la línea correcta al quitarla de guardados', async () => {
    const onRemove = jest.fn()
    const line = aLine()
    await render(
      <SavedForLaterList lines={[line]} onMoveToCart={jest.fn()} onRemove={onRemove} />,
    )

    await fireEvent.press(
      screen.getByLabelText('Quitar Chaqueta cortavientos impermeable de guardados'),
    )

    expect(onRemove).toHaveBeenCalledWith(line)
  })

  // Sin nada guardado no debe quedar un título suelto colgando bajo la cesta.
  it('no pinta nada cuando no hay líneas guardadas', async () => {
    await render(<SavedForLaterList lines={[]} onMoveToCart={jest.fn()} onRemove={jest.fn()} />)

    expect(screen.queryByTestId('saved-for-later')).toBeNull()
  })

  it('omite la etiqueta de variante y la miniatura cuando la línea no las trae', async () => {
    await render(
      <SavedForLaterList
        lines={[aLine({ variantLabel: undefined, image: undefined })]}
        onMoveToCart={jest.fn()}
        onRemove={jest.fn()}
      />,
    )

    expect(screen.queryByText('Color: Negro / Talla: M')).toBeNull()
    expect(screen.getByText('Chaqueta cortavientos impermeable')).toBeOnTheScreen()
  })
})
