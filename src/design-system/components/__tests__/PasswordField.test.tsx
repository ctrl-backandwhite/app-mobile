import { fireEvent, render, screen } from '@testing-library/react-native'

import { PasswordField } from '../PasswordField'

describe('PasswordField', () => {
  it('oculta el texto de partida', async () => {
    await render(<PasswordField label="Contraseña" />)

    expect(screen.getByLabelText('Contraseña')).toHaveProp('secureTextEntry', true)
    expect(screen.getByLabelText('Mostrar contraseña')).toBeOnTheScreen()
  })

  it('revela y vuelve a ocultar la contraseña al pulsar el ojo', async () => {
    await render(<PasswordField label="Contraseña" />)

    await fireEvent.press(screen.getByLabelText('Mostrar contraseña'))

    expect(screen.getByLabelText('Contraseña')).toHaveProp('secureTextEntry', false)

    await fireEvent.press(screen.getByLabelText('Ocultar contraseña'))

    expect(screen.getByLabelText('Contraseña')).toHaveProp('secureTextEntry', true)
  })

  it('propaga el texto escrito y el error del campo', async () => {
    const onChangeText = jest.fn()
    await render(
      <PasswordField label="Contraseña" error="Demasiado corta" onChangeText={onChangeText} />,
    )

    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Secreta1!')

    expect(onChangeText).toHaveBeenCalledWith('Secreta1!')
    expect(screen.getByText('Demasiado corta')).toBeOnTheScreen()
  })
})
