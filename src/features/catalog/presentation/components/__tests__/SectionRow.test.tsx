import { fireEvent, render, screen } from '@testing-library/react-native'

import { SectionRow } from '../SectionRow'
import { aProduct } from '../testing/product-fixture'

const PRODUCTS = [
  aProduct({ id: 'p-1', title: 'Chaqueta cortavientos' }),
  aProduct({ id: 'p-2', title: 'Mochila antirrobo' }),
]

// En @testing-library/react-native 14 tanto `render` como `fireEvent` son asíncronos: envuelven
// `act` internamente y hay que esperarlos para que el árbol quede actualizado.
describe('SectionRow', () => {
  it('pinta el título de la sección y una tarjeta por producto', async () => {
    await render(<SectionRow title="Tendencias" products={PRODUCTS} onSelect={jest.fn()} />)

    expect(screen.getByText('Tendencias')).toBeOnTheScreen()
    expect(screen.getByText('Chaqueta cortavientos')).toBeOnTheScreen()
    expect(screen.getByText('Mochila antirrobo')).toBeOnTheScreen()
  })

  it('avisa con el producto de la tarjeta pulsada', async () => {
    const onSelect = jest.fn()
    await render(<SectionRow title="Tendencias" products={PRODUCTS} onSelect={onSelect} />)

    await fireEvent.press(screen.getByLabelText('Mochila antirrobo, 24,90 €'))

    expect(onSelect).toHaveBeenCalledWith(PRODUCTS[1])
  })

  it('solo ofrece «Ver todo» cuando hay a dónde ir', async () => {
    await render(<SectionRow title="Tendencias" products={PRODUCTS} onSelect={jest.fn()} />)

    expect(screen.queryByText('Ver todo')).toBeNull()
  })

  it('avisa al pulsar «Ver todo»', async () => {
    const onSeeAll = jest.fn()
    await render(
      <SectionRow
        title="Tendencias"
        products={PRODUCTS}
        onSelect={jest.fn()}
        onSeeAll={onSeeAll}
      />,
    )

    await fireEvent.press(screen.getByLabelText('Ver todo: Tendencias'))

    expect(onSeeAll).toHaveBeenCalledTimes(1)
  })
})
