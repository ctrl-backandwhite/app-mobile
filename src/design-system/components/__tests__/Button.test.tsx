import { fireEvent, render, screen } from '@testing-library/react-native'

import { Button } from '../Button'

// En @testing-library/react-native 14 tanto `render` como `fireEvent` son asíncronos: envuelven
// `act` internamente y hay que esperarlos para que el árbol quede actualizado.
describe('Button', () => {
  it('muestra el título y avisa al pulsarlo', async () => {
    const onPress = jest.fn()
    await render(<Button title="Entrar" onPress={onPress} />)

    await fireEvent.press(screen.getByText('Entrar'))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('sustituye el título por el indicador mientras carga y no responde al toque', async () => {
    const onPress = jest.fn()
    await render(<Button title="Entrar" onPress={onPress} loading />)

    expect(screen.queryByText('Entrar')).toBeNull()
    await fireEvent.press(screen.getByTestId('button-spinner'))

    expect(onPress).not.toHaveBeenCalled()
  })

  it('no responde al toque cuando está deshabilitado', async () => {
    const onPress = jest.fn()
    await render(<Button title="Entrar" onPress={onPress} disabled />)

    await fireEvent.press(screen.getByText('Entrar'))

    expect(onPress).not.toHaveBeenCalled()
  })

  it('se anuncia como botón deshabilitado y ocupado mientras carga', async () => {
    await render(<Button title="Entrar" onPress={jest.fn()} loading />)

    const button = screen.getByRole('button')

    expect(button).toBeDisabled()
    expect(button).toBeBusy()
  })

  it('responde igual en las variantes secundarias', async () => {
    const onPress = jest.fn()
    await render(<Button title="Crear cuenta" onPress={onPress} variant="outline" />)

    await fireEvent.press(screen.getByRole('button'))

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
