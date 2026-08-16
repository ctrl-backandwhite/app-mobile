import { aCartLine } from '../testing/cart-builders'
import { FakeCartStorage } from '../testing/fake-cart-storage'
import { LoadCart } from '../usecases/load-cart'

describe('LoadCart', () => {
  it('devuelve la cesta guardada', async () => {
    const storage = new FakeCartStorage([aCartLine({ quantity: 3 })])

    expect(await new LoadCart(storage).execute()).toEqual([aCartLine({ quantity: 3 })])
  })

  it('devuelve una cesta vacía cuando no hay nada guardado', async () => {
    expect(await new LoadCart(new FakeCartStorage()).execute()).toEqual([])
  })
})
