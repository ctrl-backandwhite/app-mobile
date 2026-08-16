import { fireEvent, render, screen } from '@testing-library/react-native'

import { CartEmptyState } from '../CartEmptyState'

describe('CartEmptyState', () => {
  it('explica que la cesta está vacía y ofrece la salida al catálogo', async () => {
    await render(<CartEmptyState onBrowseCatalog={jest.fn()} />)

    expect(screen.getByText('Tu cesta está vacía')).toBeOnTheScreen()
    expect(screen.getByText('Ver el catálogo')).toBeOnTheScreen()
  })

  it('avisa al pulsar la salida al catálogo', async () => {
    const onBrowseCatalog = jest.fn()
    await render(<CartEmptyState onBrowseCatalog={onBrowseCatalog} />)

    await fireEvent.press(screen.getByText('Ver el catálogo'))

    expect(onBrowseCatalog).toHaveBeenCalledTimes(1)
  })
})
