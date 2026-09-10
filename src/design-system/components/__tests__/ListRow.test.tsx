import { fireEvent, render, screen } from '@testing-library/react-native'

import { ListRow } from '../ListRow'

describe('ListRow', () => {
  it('lleva el título y la descripción al nombre accesible', async () => {
    await render(<ListRow title="Monedero" description="Saldo y movimientos" onPress={jest.fn()} />)

    expect(screen.getByLabelText('Monedero. Saldo y movimientos')).toBeTruthy()
  })

  it('usa solo el título cuando no hay descripción', async () => {
    await render(<ListRow title="Monedero" onPress={jest.fn()} />)

    expect(screen.getByLabelText('Monedero')).toBeTruthy()
  })

  it('avisa al pulsar la fila', async () => {
    const onPress = jest.fn()
    await render(<ListRow title="Monedero" onPress={onPress} />)

    await fireEvent.press(screen.getByRole('button'))

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
