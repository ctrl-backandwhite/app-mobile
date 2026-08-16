import { render, screen } from '@testing-library/react-native'

import { SpecificationList } from '../SpecificationList'

describe('SpecificationList', () => {
  it('pinta cada especificación con su clave y su valor', async () => {
    await render(
      <SpecificationList
        specifications={[
          { key: 'Material', value: 'Poliéster 100%', position: 0 },
          { key: 'Longitud', value: '72 cm', position: 1 },
        ]}
      />,
    )

    expect(screen.getByText('Material')).toBeOnTheScreen()
    expect(screen.getByText('Poliéster 100%')).toBeOnTheScreen()
    expect(screen.getByText('Longitud')).toBeOnTheScreen()
    expect(screen.getByText('72 cm')).toBeOnTheScreen()
  })

  it('admite claves repetidas sin perder ninguna fila', async () => {
    await render(
      <SpecificationList
        specifications={[
          { key: 'Color', value: 'Azul' },
          { key: 'Color', value: 'Rojo' },
        ]}
      />,
    )

    expect(screen.getAllByText('Color')).toHaveLength(2)
  })

  it('sin especificaciones no pinta nada', async () => {
    await render(<SpecificationList specifications={[]} />)

    expect(screen.queryByText('Material')).toBeNull()
  })
})
