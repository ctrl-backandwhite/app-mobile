import { fireEvent, render, screen } from '@testing-library/react-native'

import { ProductCard } from '../ProductCard'
import { aProduct } from '../testing/product-fixture'

// En @testing-library/react-native 14 tanto `render` como `fireEvent` son asíncronos: envuelven
// `act` internamente y hay que esperarlos para que el árbol quede actualizado.
describe('ProductCard', () => {
  it('pinta el título y el precio ya formateado por el backend', async () => {
    await render(<ProductCard product={aProduct()} onPress={jest.fn()} />)

    expect(screen.getByText('Chaqueta cortavientos impermeable')).toBeOnTheScreen()
    expect(screen.getByText('24,90 €')).toBeOnTheScreen()
  })

  it('pinta el precio anterior tachado y el porcentaje cuando hay rebaja', async () => {
    await render(
      <ProductCard
        product={aProduct({ originalFormatted: '39,90 €', discountPercent: 38 })}
        onPress={jest.fn()}
      />,
    )

    expect(screen.getByText('39,90 €')).toBeOnTheScreen()
    expect(screen.getByText('−38%')).toBeOnTheScreen()
  })

  it('no pinta ningún precio anterior cuando el producto no está rebajado', async () => {
    await render(<ProductCard product={aProduct()} onPress={jest.fn()} />)

    expect(screen.queryByText('39,90 €')).toBeNull()
    expect(screen.getByText('24,90 €')).toBeOnTheScreen()
  })

  it('no pinta el tachado si falta el porcentaje: la rebaja quedaría a medias', async () => {
    await render(
      <ProductCard product={aProduct({ originalFormatted: '39,90 €' })} onPress={jest.fn()} />,
    )

    expect(screen.queryByText('39,90 €')).toBeNull()
  })

  it('avisa con el producto al pulsar la tarjeta', async () => {
    const product = aProduct()
    const onPress = jest.fn()
    await render(<ProductCard product={product} onPress={onPress} />)

    await fireEvent.press(screen.getByRole('button'))

    expect(onPress).toHaveBeenCalledWith(product)
  })

  it('se anuncia como botón con el título y el precio', async () => {
    await render(<ProductCard product={aProduct()} onPress={jest.fn()} />)

    expect(
      screen.getByLabelText('Chaqueta cortavientos impermeable, 24,90 €'),
    ).toBeOnTheScreen()
  })

  it('sin precio formateado no revienta, no pinta precio y sigue siendo pulsable', async () => {
    const product = aProduct({ displayFormatted: undefined })
    const onPress = jest.fn()
    await render(<ProductCard product={product} onPress={onPress} />)

    expect(screen.getByText('Chaqueta cortavientos impermeable')).toBeOnTheScreen()
    expect(screen.queryByText('24,90 €')).toBeNull()
    expect(screen.getByLabelText('Chaqueta cortavientos impermeable')).toBeOnTheScreen()

    await fireEvent.press(screen.getByRole('button'))

    expect(onPress).toHaveBeenCalledWith(product)
  })

  it('oculta valoración y ventas cuando el producto no las trae', async () => {
    await render(
      <ProductCard
        product={aProduct({ rating: undefined, monthlySales: 0 })}
        onPress={jest.fn()}
      />,
    )

    expect(screen.queryByText('4.6')).toBeNull()
    expect(screen.queryByText('1240')).toBeNull()
  })

  it('pinta cada dato por separado si solo llega uno de los dos', async () => {
    await render(
      <ProductCard product={aProduct({ rating: undefined })} onPress={jest.fn()} />,
    )

    expect(screen.getByText('1240')).toBeOnTheScreen()
    expect(screen.queryByText('4.6')).toBeNull()
  })

  it('mantiene el hueco de la imagen cuando el producto no trae ninguna', async () => {
    await render(
      <ProductCard
        product={aProduct({ mainImage: undefined, monthlySales: 0 })}
        onPress={jest.fn()}
      />,
    )

    expect(screen.getByText('4.6')).toBeOnTheScreen()
    expect(screen.getByLabelText('Chaqueta cortavientos impermeable, 24,90 €')).toBeOnTheScreen()
  })

  it('abrevia las ventas del mes a partir de diez mil', async () => {
    await render(<ProductCard product={aProduct({ monthlySales: 12500 })} onPress={jest.fn()} />)

    expect(screen.getByText('12.5k')).toBeOnTheScreen()
  })
})
