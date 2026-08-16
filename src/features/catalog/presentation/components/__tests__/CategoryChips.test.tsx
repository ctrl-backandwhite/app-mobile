import { fireEvent, render, screen } from '@testing-library/react-native'

import { CategoryChipItem, CategoryChips } from '../CategoryChips'

const CATEGORIES: readonly CategoryChipItem[] = [
  { id: 'c-1', name: 'Moda mujer' },
  { id: 'c-2', name: 'Hogar' },
  { id: 'c-3', name: 'Electrónica' },
]

// En @testing-library/react-native 14 tanto `render` como `fireEvent` son asíncronos: envuelven
// `act` internamente y hay que esperarlos para que el árbol quede actualizado.
describe('CategoryChips', () => {
  it('pinta una píldora por categoría', async () => {
    await render(<CategoryChips categories={CATEGORIES} onSelect={jest.fn()} />)

    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('marca como seleccionada solo la categoría activa', async () => {
    await render(
      <CategoryChips categories={CATEGORIES} selectedId="c-2" onSelect={jest.fn()} />,
    )

    expect(screen.getByLabelText('Hogar')).toBeSelected()
    expect(screen.getByLabelText('Moda mujer')).not.toBeSelected()
  })

  it('no marca ninguna cuando no hay categoría activa', async () => {
    await render(<CategoryChips categories={CATEGORIES} onSelect={jest.fn()} />)

    expect(screen.getByLabelText('Hogar')).not.toBeSelected()
  })

  it('avisa con el identificador de la categoría pulsada', async () => {
    const onSelect = jest.fn()
    await render(<CategoryChips categories={CATEGORIES} onSelect={onSelect} />)

    await fireEvent.press(screen.getByLabelText('Electrónica'))

    expect(onSelect).toHaveBeenCalledWith('c-3')
  })
})
