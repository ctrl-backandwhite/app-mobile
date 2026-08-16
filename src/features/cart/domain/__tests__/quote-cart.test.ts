import { AppError } from '@core/errors/app-error'

import { aCartLine, aCartQuote } from '../testing/cart-builders'
import { FakeQuoteRepository } from '../testing/fake-quote-repository'
import { QuoteCart } from '../usecases/quote-cart'

describe('QuoteCart', () => {
  it('pide al backend el precio vigente de cada línea', async () => {
    const quote = aCartQuote()
    const repository = new FakeQuoteRepository({ quote })

    const result = await new QuoteCart(repository).execute([
      aCartLine({ quantity: 2 }),
      aCartLine({ productId: 'p-2', variantId: 'v-9', quantity: 5 }),
    ])

    expect(result).toEqual({ ok: true, value: quote })
    expect(repository.lastItems).toEqual([
      { productId: 'p-1', variantId: undefined, quantity: 2 },
      { productId: 'p-2', variantId: 'v-9', quantity: 5 },
    ])
  })

  it('no llama al backend con la cesta vacía', async () => {
    const repository = new FakeQuoteRepository()

    const result = await new QuoteCart(repository).execute([])

    expect(result).toEqual({ ok: true, value: null })
    expect(repository.calls).toBe(0)
  })

  it('propaga el fallo del backend sin traducirlo', async () => {
    const repository = new FakeQuoteRepository({ error: new AppError('NETWORK', 'sin conexión') })

    const result = await new QuoteCart(repository).execute([aCartLine()])

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})
