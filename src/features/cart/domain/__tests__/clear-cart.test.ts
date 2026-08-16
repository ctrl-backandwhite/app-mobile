import { aCartLine } from '../testing/cart-builders'
import { FakeCartStorage } from '../testing/fake-cart-storage'
import { ClearCart } from '../usecases/clear-cart'

describe('ClearCart', () => {
  it('vacía la cesta guardada', async () => {
    const storage = new FakeCartStorage([aCartLine()])

    await new ClearCart(storage).execute()

    expect(storage.cleared).toBe(true)
    expect(await storage.load()).toEqual([])
  })
})
