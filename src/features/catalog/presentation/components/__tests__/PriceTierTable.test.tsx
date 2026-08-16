import { render, screen } from '@testing-library/react-native'

import { priceTierFor } from '@features/catalog/domain/entities/product-detail'
import { aProductDetail } from '@features/catalog/domain/testing/fake-catalog-repository'

import { PriceTierTable } from '../PriceTierTable'
import { someTiers } from '../testing/detail-fixture'

/**
 * El tramo a resaltar lo resuelve el dominio, no la tabla. Las pruebas lo piden por la misma vía que
 * la pantalla para que sigan valiendo como comprobación de extremo a extremo de esa regla.
 */
function tierFor(quantity: number, tiers = someTiers()) {
  return priceTierFor(aProductDetail({ priceTiers: tiers }), quantity)
}

describe('PriceTierTable', () => {
  it('pinta un tramo por fila con el importe ya formateado por el backend', async () => {
    await render(<PriceTierTable tiers={someTiers()} />)

    expect(screen.getByText('1 – 9 uds.')).toBeOnTheScreen()
    expect(screen.getByText('10 – 49 uds.')).toBeOnTheScreen()
    expect(screen.getByText('desde 50 uds.')).toBeOnTheScreen()
    expect(screen.getByText('21,50 €')).toBeOnTheScreen()
  })

  it('resalta el tramo que le toca a la cantidad', async () => {
    await render(<PriceTierTable tiers={someTiers()} highlighted={tierFor(12)} />)

    expect(screen.getByTestId('price-tier-10')).toBeSelected()
    expect(screen.getByTestId('price-tier-1')).not.toBeSelected()
    expect(screen.getByTestId('price-tier-50')).not.toBeSelected()
  })

  it('resalta el último tramo cuando la cantidad se sale por arriba', async () => {
    await render(<PriceTierTable tiers={someTiers()} highlighted={tierFor(500)} />)

    expect(screen.getByTestId('price-tier-50')).toBeSelected()
  })

  it('no resalta ninguno si no se le indica el tramo', async () => {
    await render(<PriceTierTable tiers={someTiers()} />)

    expect(screen.getByTestId('price-tier-1')).not.toBeSelected()
    expect(screen.getByTestId('price-tier-10')).not.toBeSelected()
    expect(screen.getByTestId('price-tier-50')).not.toBeSelected()
  })

  it('ordena los tramos aunque lleguen desordenados', async () => {
    await render(<PriceTierTable tiers={someTiers().reverse()} highlighted={tierFor(1)} />)

    const rows: string[] = screen
      .getAllByTestId(/^price-tier-/)
      .map((row): string => String(row.props.testID))

    expect(rows).toEqual(['price-tier-1', 'price-tier-10', 'price-tier-50'])
    expect(screen.getByTestId('price-tier-1')).toBeSelected()
  })

  it('sin tramos no pinta nada', async () => {
    await render(<PriceTierTable tiers={[]} highlighted={undefined} />)

    expect(screen.queryByText('Precio por cantidad')).toBeNull()
  })
})
