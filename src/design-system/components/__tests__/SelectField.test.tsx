import { fireEvent, render, screen } from '@testing-library/react-native'

import { SelectField } from '../SelectField'

/**
 * El campo que no se teclea. Va calcado a `TextField` a propósito, así que lo que hay que fijar es
 * que ANUNCIE lo que tiene puesto: si se leyera igual con y sin valor, la única diferencia entre
 * «sin elegir» y «elegido» sería el color de la letra.
 */
describe('SelectField', () => {
  it('anuncia lo elegido junto a la etiqueta', async () => {
    await render(<SelectField label="País" value="España" onPress={jest.fn()} />)

    expect(screen.getByLabelText('País')).toHaveAccessibilityValue({ text: 'España' })
    expect(screen.getByText('España')).toBeTruthy()
  })

  it('enseña el marcador mientras no hay nada elegido', async () => {
    await render(<SelectField label="País" placeholder="Elige tu país" onPress={jest.fn()} />)

    expect(screen.getByText('Elige tu país')).toBeTruthy()
  })

  it('un valor vacío cuenta como no elegido', async () => {
    await render(
      <SelectField label="País" value="" placeholder="Elige tu país" onPress={jest.fn()} />,
    )

    expect(screen.getByText('Elige tu país')).toBeTruthy()
  })

  it('abre la lista al pulsarlo', async () => {
    const onPress = jest.fn()
    await render(<SelectField label="País" onPress={onPress} />)

    await fireEvent.press(screen.getByLabelText('País'))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('enseña el error y, cuando no lo hay, la aclaración', async () => {
    const { rerender } = await render(
      <SelectField label="País" onPress={jest.fn()} hint="Solo donde enviamos" />,
    )
    expect(screen.getByText('Solo donde enviamos')).toBeTruthy()

    await rerender(
      <SelectField
        label="País"
        onPress={jest.fn()}
        hint="Solo donde enviamos"
        error="No se ha podido cargar la lista."
      />,
    )
    expect(screen.getByText('No se ha podido cargar la lista.')).toBeTruthy()
    expect(screen.queryByText('Solo donde enviamos')).toBeNull()
  })
})
