import { fireEvent, render, screen } from '@testing-library/react-native'

import { SearchBar } from '../SearchBar'

// En @testing-library/react-native 14 tanto `render` como `fireEvent` son asíncronos: envuelven
// `act` internamente y hay que esperarlos para que el árbol quede actualizado.
describe('SearchBar', () => {
  it('muestra el texto escrito y lo comunica al teclear', async () => {
    const onChangeText = jest.fn()
    await render(<SearchBar value="mochila" onChangeText={onChangeText} onSubmit={jest.fn()} />)

    const field = screen.getByLabelText('Buscar productos')

    expect(field).toHaveDisplayValue('mochila')
    await fireEvent.changeText(field, 'mochilas')

    expect(onChangeText).toHaveBeenCalledWith('mochilas')
  })

  it('busca al enviar desde el teclado', async () => {
    const onSubmit = jest.fn()
    await render(<SearchBar value="mochila" onChangeText={jest.fn()} onSubmit={onSubmit} />)

    await fireEvent(screen.getByLabelText('Buscar productos'), 'submitEditing')

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('acepta un marcador propio sin perder el nombre accesible', async () => {
    await render(
      <SearchBar
        value=""
        onChangeText={jest.fn()}
        onSubmit={jest.fn()}
        placeholder="Busca en Moda mujer"
      />,
    )

    expect(screen.getByPlaceholderText('Busca en Moda mujer')).toBeOnTheScreen()
    expect(screen.getByLabelText('Buscar productos')).toBeOnTheScreen()
  })
})
