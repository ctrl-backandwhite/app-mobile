import { AppError } from '@core/errors/app-error'

import { aCartLine } from '../testing/cart-builders'
import { FakeCartStorage } from '../testing/fake-cart-storage'
import { FakeSavedCartRepository } from '../testing/fake-saved-cart-repository'
import { MoveToCart } from '../usecases/move-to-cart'

describe('MoveToCart', () => {
  it('borra la línea de la cuenta y la añade a la cesta', async () => {
    const storage = new FakeCartStorage()
    const savedCart = new FakeSavedCartRepository({ saved: [] })

    const result = await new MoveToCart(storage, savedCart).execute(
      aCartLine({ variantId: 'v-1', quantity: 3 }),
    )

    expect(savedCart.removed).toEqual([{ productId: 'p-1', variantId: 'v-1' }])
    expect(result.ok && result.value.lines[0]?.quantity).toBe(3)
    expect(result.ok && result.value.saved).toEqual([])
    expect(await storage.load()).toHaveLength(1)
  })

  it('suma las unidades si esa línea ya estaba en la cesta', async () => {
    const storage = new FakeCartStorage([aCartLine({ quantity: 1 })])
    const savedCart = new FakeSavedCartRepository()

    const result = await new MoveToCart(storage, savedCart).execute(aCartLine({ quantity: 2 }))

    expect(result.ok && result.value.lines).toHaveLength(1)
    expect(result.ok && result.value.lines[0]?.quantity).toBe(3)
  })

  it('no toca la cesta cuando el backend falla, y la línea sigue guardada', async () => {
    const storage = new FakeCartStorage()
    const savedCart = new FakeSavedCartRepository({ error: new AppError('SERVER', 'se ha roto') })

    const result = await new MoveToCart(storage, savedCart).execute(aCartLine())

    expect(!result.ok && result.error.code).toBe('SERVER')
    expect(await storage.load()).toEqual([])
    expect(storage.saves).toBe(0)
  })
})
