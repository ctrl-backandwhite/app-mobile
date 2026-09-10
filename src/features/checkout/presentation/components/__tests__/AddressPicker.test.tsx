import { fireEvent, screen } from '@testing-library/react-native'

import { anAddress } from '@features/checkout/domain/testing/checkout-builders'

import { AddressPicker } from '../AddressPicker'
import { renderCheckout } from '../../testing/render-checkout'

describe('AddressPicker', () => {
  it('pinta la dirección con su etiqueta y su resumen', async () => {
    await renderCheckout(
      <AddressPicker
        addresses={[anAddress({ label: 'Oficina' })]}
        selectedId="a-1"
        onSelect={jest.fn()}
        onAdd={jest.fn()}
      />,
    )

    expect(screen.getByText('Oficina')).toBeTruthy()
    expect(screen.getByText('Calle Mayor 1, Madrid, 28013, ES')).toBeTruthy()
    expect(screen.getByLabelText('Enviar a Oficina')).toBeSelected()
  })

  it('avisa cuando la libreta está vacía', async () => {
    await renderCheckout(<AddressPicker addresses={[]} onSelect={jest.fn()} onAdd={jest.fn()} />)

    expect(screen.getByText(/Todavía no tienes ninguna dirección/)).toBeTruthy()
  })

  it('no dice que la libreta está vacía mientras aún se está cargando', async () => {
    // Antes salía «Cargando direcciones…»; ahora son huecos con la forma de las tarjetas. Lo que
    // importa sigue siendo lo mismo: que no se anuncie un vacío que todavía no se sabe si lo es.
    await renderCheckout(<AddressPicker addresses={[]} loading onSelect={jest.fn()} onAdd={jest.fn()} />)

    expect(screen.queryByText(/Todavía no tienes ninguna dirección/)).toBeNull()
  })

  it('avisa de la dirección elegida y del alta', async () => {
    const onSelect = jest.fn()
    const onAdd = jest.fn()
    await renderCheckout(
      <AddressPicker addresses={[anAddress()]} onSelect={onSelect} onAdd={onAdd} />,
    )

    await fireEvent.press(screen.getByLabelText('Enviar a Casa'))
    await fireEvent.press(screen.getByLabelText('Añadir una dirección de envío'))

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'a-1' }))
    expect(onAdd).toHaveBeenCalled()
  })
})
