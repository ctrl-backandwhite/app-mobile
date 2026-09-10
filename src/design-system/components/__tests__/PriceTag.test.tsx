import { render, screen } from '@testing-library/react-native'

import { PriceTag } from '../PriceTag'

describe('PriceTag', () => {
  it('pinta solo el precio cuando no hay rebaja', async () => {
    await render(<PriceTag price="12,90 €" />)

    expect(screen.getByText('12,90 €')).toBeTruthy()
    expect(screen.queryByText(/−/)).toBeNull()
  })

  it('pinta el precio anterior y el porcentaje cuando hay rebaja', async () => {
    await render(<PriceTag price="9,90 €" original="19,90 €" discountPercent={50} />)

    expect(screen.getByText('9,90 €')).toBeTruthy()
    expect(screen.getByText('19,90 €')).toBeTruthy()
    expect(screen.getByText('−50 %')).toBeTruthy()
  })

  it('no anuncia un porcentaje de cero', async () => {
    await render(<PriceTag price="19,90 €" original="24,90 €" discountPercent={0} />)

    expect(screen.queryByText('−0 %')).toBeNull()
  })

  it('no pinta el tachado si falta el porcentaje: la rebaja quedaría a medias', async () => {
    await render(<PriceTag price="24,90 €" original="39,90 €" />)

    expect(screen.queryByText('39,90 €')).toBeNull()
  })
})
