import { fireEvent, render, screen } from '@testing-library/react-native'

import { QuantityStepper } from '../QuantityStepper'

describe('QuantityStepper', () => {
  it('pinta la cantidad entre los dos botones y los anuncia', async () => {
    await render(<QuantityStepper value={3} min={1} onChange={jest.fn()} />)

    expect(screen.getByText('3')).toBeOnTheScreen()
    expect(screen.getByLabelText('Quitar una unidad')).toBeOnTheScreen()
    expect(screen.getByLabelText('Añadir una unidad')).toBeOnTheScreen()
  })

  it('suma una unidad al pulsar más', async () => {
    const onChange = jest.fn()
    await render(<QuantityStepper value={3} min={1} onChange={onChange} />)

    await fireEvent.press(screen.getByLabelText('Añadir una unidad'))

    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('resta una unidad al pulsar menos mientras quede margen', async () => {
    const onChange = jest.fn()
    await render(<QuantityStepper value={3} min={1} onChange={onChange} />)

    await fireEvent.press(screen.getByLabelText('Quitar una unidad'))

    expect(onChange).toHaveBeenCalledWith(2)
  })

  // El mínimo es el pedido mínimo del producto: bajar de ahí produciría un pedido que el backend
  // rechaza después, ya con el usuario convencido de la cantidad.
  it('nunca baja del mínimo', async () => {
    const onChange = jest.fn()
    await render(<QuantityStepper value={5} min={5} onChange={onChange} />)

    await fireEvent.press(screen.getByLabelText('Quitar una unidad'))

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('5')).toBeOnTheScreen()
  })

  it('anuncia el botón de quitar como deshabilitado en el mínimo', async () => {
    await render(<QuantityStepper value={2} min={2} onChange={jest.fn()} />)

    expect(screen.getByLabelText('Quitar una unidad')).toBeDisabled()
  })

  it('deja seguir subiendo aunque el mínimo sea alto', async () => {
    const onChange = jest.fn()
    await render(<QuantityStepper value={10} min={10} onChange={onChange} />)

    await fireEvent.press(screen.getByLabelText('Añadir una unidad'))

    expect(onChange).toHaveBeenCalledWith(11)
  })
})
