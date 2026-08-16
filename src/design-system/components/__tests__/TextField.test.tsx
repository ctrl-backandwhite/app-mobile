import { fireEvent, render, screen } from '@testing-library/react-native'

import { TextField } from '../TextField'

describe('TextField', () => {
  it('localiza el campo por su etiqueta visible y propaga el texto escrito', async () => {
    const onChangeText = jest.fn()
    await render(<TextField label="Correo electrónico" value="" onChangeText={onChangeText} />)

    await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'ana@nx036.com')

    expect(onChangeText).toHaveBeenCalledWith('ana@nx036.com')
  })

  it('muestra el mensaje de error debajo del campo', async () => {
    await render(<TextField label="Correo electrónico" error="Formato no válido" />)

    expect(screen.getByText('Formato no válido')).toBeOnTheScreen()
  })

  it('no pinta nada cuando no hay error', async () => {
    await render(<TextField label="Correo electrónico" />)

    expect(screen.queryByText('Formato no válido')).toBeNull()
  })

  it('deja pasar las propiedades del TextInput nativo', async () => {
    await render(
      <TextField label="Correo electrónico" keyboardType="email-address" autoCapitalize="none" />,
    )

    const input = screen.getByLabelText('Correo electrónico')

    expect(input).toHaveProp('keyboardType', 'email-address')
    expect(input).toHaveProp('autoCapitalize', 'none')
  })
})
