import { fireEvent, render, screen } from '@testing-library/react-native'

import { anAddress } from '@features/checkout/domain/testing/checkout-builders'

import { AddressPicker } from '../AddressPicker'

describe('AddressPicker', () => {
  it('pinta la dirección con su etiqueta y su resumen', async () => {
    await render(
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
    await render(<AddressPicker addresses={[]} onSelect={jest.fn()} onAdd={jest.fn()} />)

    expect(screen.getByText(/Todavía no tienes ninguna dirección/)).toBeTruthy()
  })

  it('dice que está cargando antes de tener la libreta', async () => {
    await render(<AddressPicker addresses={[]} loading onSelect={jest.fn()} onAdd={jest.fn()} />)

    expect(screen.getByText('Cargando direcciones…')).toBeTruthy()
  })

  it('avisa de la dirección elegida y del alta', async () => {
    const onSelect = jest.fn()
    const onAdd = jest.fn()
    await render(
      <AddressPicker addresses={[anAddress()]} onSelect={onSelect} onAdd={onAdd} />,
    )

    await fireEvent.press(screen.getByLabelText('Enviar a Casa'))
    await fireEvent.press(screen.getByLabelText('Añadir una dirección de envío'))

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'a-1' }))
    expect(onAdd).toHaveBeenCalled()
  })
})
