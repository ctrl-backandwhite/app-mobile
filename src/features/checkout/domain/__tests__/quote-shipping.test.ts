import { AppError } from '@core/errors/app-error'

import { aCheckoutItem, aShippingQuote } from '../testing/checkout-builders'
import { FakeShippingRepository } from '../testing/fake-shipping-repository'
import { ListRegions } from '../usecases/list-regions'
import { QuoteShipping } from '../usecases/quote-shipping'

describe('QuoteShipping', () => {
  it('no cotiza sin país: no hay destino que cotizar', async () => {
    const repository = new FakeShippingRepository()

    const result = await new QuoteShipping(repository).execute({ items: [aCheckoutItem()] })

    expect(repository.quoteCalls).toBe(0)
    expect(result.ok && result.value).toBeNull()
  })

  it('no cotiza con la cesta vacía', async () => {
    const repository = new FakeShippingRepository()

    const result = await new QuoteShipping(repository).execute({ country: 'ES', items: [] })

    expect(repository.quoteCalls).toBe(0)
    expect(result.ok && result.value).toBeNull()
  })

  it('cotiza con destino, región y cupón', async () => {
    const repository = new FakeShippingRepository({ quote: aShippingQuote({ totalFormatted: '36,30 €' }) })

    const result = await new QuoteShipping(repository).execute({
      country: 'US',
      region: 'CA',
      items: [aCheckoutItem()],
      couponCode: 'VERANO',
    })

    expect(repository.lastQuery).toEqual({
      country: 'US',
      region: 'CA',
      items: [aCheckoutItem()],
      couponCode: 'VERANO',
    })
    expect(result.ok && result.value?.totalFormatted).toBe('36,30 €')
  })

  it('propaga el fallo del backend', async () => {
    const repository = new FakeShippingRepository({ error: new AppError('SERVER', 'Vaya') })

    const result = await new QuoteShipping(repository).execute({
      country: 'ES',
      items: [aCheckoutItem()],
    })

    expect(!result.ok && result.error.code).toBe('SERVER')
  })
})

describe('ListRegions', () => {
  it('no pregunta por un país a medio teclear', async () => {
    const repository = new FakeShippingRepository()

    const result = await new ListRegions(repository).execute('E')

    expect(repository.lastCountry).toBeNull()
    expect(result.ok && result.value).toEqual([])
  })

  it('pregunta con el código en mayúsculas', async () => {
    const repository = new FakeShippingRepository({ regions: [{ code: 'CA', name: 'California' }] })

    const result = await new ListRegions(repository).execute(' us ')

    expect(repository.lastCountry).toBe('US')
    expect(result.ok && result.value[0]?.name).toBe('California')
  })
})
