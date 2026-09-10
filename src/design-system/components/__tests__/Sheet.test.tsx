import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'

import { withSafeArea } from '@shared/testing/safe-area'

import { Sheet } from '../Sheet'

describe('Sheet', () => {
  it('no pinta el contenido mientras está cerrada', async () => {
    await render(
      withSafeArea(
        <Sheet visible={false} onClose={jest.fn()} title="Ordenar y filtrar">
          <Text>Precio de coste</Text>
        </Sheet>,
      ),
    )

    expect(screen.queryByText('Precio de coste')).toBeNull()
  })

  it('pinta el título y el contenido al abrirse', async () => {
    await render(
      withSafeArea(
        <Sheet visible onClose={jest.fn()} title="Ordenar y filtrar">
          <Text>Precio de coste</Text>
        </Sheet>,
      ),
    )

    expect(screen.getByText('Ordenar y filtrar')).toBeTruthy()
    expect(screen.getByText('Precio de coste')).toBeTruthy()
  })

  it('cierra al tocar el velo o el aspa', async () => {
    const onClose = jest.fn()
    await render(
      withSafeArea(
        <Sheet visible onClose={onClose} title="Ordenar y filtrar">
          <Text>Precio de coste</Text>
        </Sheet>,
      ),
    )

    // Dos salidas con la misma etiqueta: el velo de fondo y el botón de la cabecera.
    const [velo] = screen.getAllByLabelText('Cerrar')
    await fireEvent.press(velo as Parameters<typeof fireEvent.press>[0])

    expect(onClose).toHaveBeenCalled()
  })
})
