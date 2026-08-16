import { aCartLine } from '../testing/cart-builders'
import { FakeCartStorage } from '../testing/fake-cart-storage'
import { RemoveFromCart } from '../usecases/remove-from-cart'

describe('RemoveFromCart', () => {
  it('quita la línea y persiste la cesta resultante', async () => {
    const storage = new FakeCartStorage([aCartLine(), aCartLine({ productId: 'p-2' })])

    const lines = await new RemoveFromCart(storage).execute({ productId: 'p-1' })

    expect(lines).toEqual([aCartLine({ productId: 'p-2' })])
    expect(await storage.load()).toEqual(lines)
  })

  it('quita solo la variante indicada', async () => {
    const storage = new FakeCartStorage([
      aCartLine({ variantId: 'v-1' }),
      aCartLine({ variantId: 'v-2' }),
    ])

    const lines = await new RemoveFromCart(storage).execute({ productId: 'p-1', variantId: 'v-1' })

    expect(lines).toHaveLength(1)
    expect(lines[0]?.variantId).toBe('v-2')
  })

  it('deja la cesta igual si la línea no está', async () => {
    const storage = new FakeCartStorage([aCartLine()])

    expect(await new RemoveFromCart(storage).execute({ productId: 'p-9' })).toEqual([aCartLine()])
  })
})
