import { fireEvent, render, screen } from '@testing-library/react-native'
import { ReactElement } from 'react'

import { ProductFilters } from '@features/catalog/domain/entities/filters'
import { withSafeArea } from '@shared/testing/safe-area'

import { FilterSheet } from '../FilterSheet'

function abre(
  value: ProductFilters,
  onApply: (filters: ProductFilters) => void = jest.fn(),
  onClose: () => void = jest.fn(),
): ReactElement {
  return withSafeArea(
    <FilterSheet visible onClose={onClose} value={value} onApply={onApply} />,
  )
}

describe('FilterSheet', () => {
  it('devuelve el orden elegido al aplicar', async () => {
    const onApply = jest.fn()
    await render(abre({}, onApply))

    await fireEvent.press(screen.getByText('Más vendidos'))
    await fireEvent.press(screen.getByTestId('filtros-aplicar'))

    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ sort: 'sales' }))
  })

  it('convierte el precio tecleado en número y deja fuera el campo vacío', async () => {
    const onApply = jest.fn()
    await render(abre({}, onApply))

    // Con coma decimal, que es como se teclea en español.
    await fireEvent.changeText(screen.getByLabelText('Desde'), '12,50')
    await fireEvent.press(screen.getByTestId('filtros-aplicar'))

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ minPrice: 12.5, maxPrice: undefined }),
    )
  })

  it('parte de los filtros que ya están aplicados', async () => {
    await render(abre({ minPrice: 5, sort: 'newest' }))

    expect(screen.getByLabelText('Desde').props.value).toBe('5')
  })

  it('quitar filtros vacía los criterios sin cerrar la hoja', async () => {
    const onClose = jest.fn()
    await render(abre({ minPrice: 5, hasVideo: true }, jest.fn(), onClose))

    await fireEvent.press(screen.getByText('Quitar filtros'))

    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Desde').props.value).toBe('')
  })

  it('cierra la hoja después de aplicar', async () => {
    const onClose = jest.fn()
    await render(abre({}, jest.fn(), onClose))

    await fireEvent.press(screen.getByTestId('filtros-aplicar'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
