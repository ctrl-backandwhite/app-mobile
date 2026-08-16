import { fireEvent, render, screen } from '@testing-library/react-native'

import { EmptyState } from '../EmptyState'
import { ProductCardSkeleton } from '../ProductCardSkeleton'

// En @testing-library/react-native 14 tanto `render` como `fireEvent` son asíncronos: envuelven
// `act` internamente y hay que esperarlos para que el árbol quede actualizado.
describe('EmptyState', () => {
  it('pinta el título y el mensaje', async () => {
    await render(<EmptyState title="Sin resultados" message="Prueba con otras palabras." />)

    expect(screen.getByText('Sin resultados')).toBeOnTheScreen()
    expect(screen.getByText('Prueba con otras palabras.')).toBeOnTheScreen()
  })

  it('no pinta ningún botón cuando no hay acción que ofrecer', async () => {
    await render(<EmptyState title="Sin resultados" message="Prueba con otras palabras." />)

    expect(screen.queryByRole('button')).toBeNull()
  })

  it('ofrece la acción de reintento y avisa al pulsarla', async () => {
    const onAction = jest.fn()
    await render(
      <EmptyState
        title="No se pudo cargar"
        message="Revisa tu conexión."
        actionLabel="Reintentar"
        onAction={onAction}
      />,
    )

    await fireEvent.press(screen.getByText('Reintentar'))

    expect(onAction).toHaveBeenCalledTimes(1)
  })
})

describe('ProductCardSkeleton', () => {
  it('ocupa el hueco de la tarjeta sin anunciarse al lector de pantalla', async () => {
    await render(<ProductCardSkeleton />)

    // Queda fuera del árbol accesible a propósito, y las consultas descartan por defecto lo oculto:
    // que haga falta `includeHiddenElements` es justamente la prueba de que no se anuncia.
    expect(screen.getByTestId('product-card-skeleton', { includeHiddenElements: true })).toBeOnTheScreen()
    expect(screen.queryByTestId('product-card-skeleton')).toBeNull()
  })
})
