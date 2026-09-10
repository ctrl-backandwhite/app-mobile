import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'

import { Checkbox } from '../Checkbox'

describe('Checkbox', () => {
  it('se anuncia como casilla con su estado', async () => {
    await render(<Checkbox label="Acepto los términos" checked onToggle={jest.fn()} />)

    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('avisa al pulsar sobre la etiqueta, no solo sobre el cuadro', async () => {
    const onToggle = jest.fn()
    await render(<Checkbox label="Acepto los términos" checked={false} onToggle={onToggle} />)

    await fireEvent.press(screen.getByText('Acepto los términos'))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('deja hueco bajo la etiqueta para lo que cuelgue de ella', async () => {
    await render(
      <Checkbox label="Acepto los términos" checked={false} onToggle={jest.fn()}>
        <Text>Leer los términos</Text>
      </Checkbox>,
    )

    expect(screen.getByText('Leer los términos')).toBeTruthy()
  })
})
