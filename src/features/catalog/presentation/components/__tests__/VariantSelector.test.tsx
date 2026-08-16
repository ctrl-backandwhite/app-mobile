import { fireEvent, render, screen } from '@testing-library/react-native'

import { VariantSelector } from '../VariantSelector'
import { aColorOption, aSizeOption } from '../testing/detail-fixture'

describe('VariantSelector', () => {
  it('pinta un grupo por eje con todos sus valores', async () => {
    await render(
      <VariantSelector
        options={[aColorOption(), aSizeOption()]}
        selection={{}}
        onSelect={jest.fn()}
      />,
    )

    expect(screen.getByText('Color')).toBeOnTheScreen()
    expect(screen.getByText('Talla')).toBeOnTheScreen()
    expect(screen.getByLabelText('Color: Azul')).toBeOnTheScreen()
    expect(screen.getByLabelText('Talla: L')).toBeOnTheScreen()
  })

  it('marca como elegido el valor de la selección y solo ese', async () => {
    await render(
      <VariantSelector
        options={[aColorOption(), aSizeOption()]}
        selection={{ Color: 'Rojo' }}
        onSelect={jest.fn()}
      />,
    )

    expect(screen.getByLabelText('Color: Rojo')).toBeSelected()
    expect(screen.getByLabelText('Color: Azul')).not.toBeSelected()
    expect(screen.getByLabelText('Talla: M')).not.toBeSelected()
  })

  it('avisa con el eje y el valor al elegir', async () => {
    const onSelect = jest.fn()
    await render(
      <VariantSelector options={[aSizeOption()]} selection={{}} onSelect={onSelect} />,
    )

    await fireEvent.press(screen.getByLabelText('Talla: L'))

    expect(onSelect).toHaveBeenCalledWith('Talla', 'L')
  })

  it('avisa igual al elegir un color desde su miniatura', async () => {
    const onSelect = jest.fn()
    await render(
      <VariantSelector options={[aColorOption()]} selection={{}} onSelect={onSelect} />,
    )

    await fireEvent.press(screen.getByLabelText('Color: Rojo'))

    expect(onSelect).toHaveBeenCalledWith('Color', 'Rojo')
  })

  it('el valor con foto se pinta como miniatura y el que no la tiene como píldora', async () => {
    await render(
      <VariantSelector
        options={[aColorOption(), aSizeOption()]}
        selection={{}}
        onSelect={jest.fn()}
      />,
    )

    // La píldora lleva el texto dentro; la miniatura solo la imagen.
    expect(screen.getByText('M')).toBeOnTheScreen()
    expect(screen.queryByText('Azul')).toBeNull()
  })

  it('sin ejes utilizables no pinta nada', async () => {
    await render(<VariantSelector options={[]} selection={{}} onSelect={jest.fn()} />)

    expect(screen.queryByText('Color')).toBeNull()
  })

  it('descarta el eje que llega sin valores en vez de dejar un título suelto', async () => {
    await render(
      <VariantSelector
        options={[aColorOption({ values: [] })]}
        selection={{}}
        onSelect={jest.fn()}
      />,
    )

    expect(screen.queryByText('Color')).toBeNull()
  })
})
