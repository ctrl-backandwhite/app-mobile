import { AppError } from '@core/errors/app-error'

import { aCartLine } from '../testing/cart-builders'
import { FakeCartStorage } from '../testing/fake-cart-storage'
import { FakeSavedCartRepository } from '../testing/fake-saved-cart-repository'
import { SaveForLater } from '../usecases/save-for-later'

describe('SaveForLater', () => {
  it('quita la línea de la cesta y la guarda en la cuenta', async () => {
    const line = aCartLine({ quantity: 2 })
    const storage = new FakeCartStorage([line, aCartLine({ productId: 'p-2' })])
    const savedCart = new FakeSavedCartRepository({ saved: [line] })

    const result = await new SaveForLater(storage, savedCart).execute({ productId: 'p-1' })

    expect(result.ok && result.value.lines).toEqual([aCartLine({ productId: 'p-2' })])
    expect(result.ok && result.value.saved).toEqual([line])
    expect(savedCart.savedLines).toEqual([line])
    expect(await storage.load()).toEqual([aCartLine({ productId: 'p-2' })])
  })

  it('deja la línea en la cesta cuando el backend falla', async () => {
    const storage = new FakeCartStorage([aCartLine()])
    const savedCart = new FakeSavedCartRepository({ error: new AppError('NETWORK', 'sin conexión') })

    const result = await new SaveForLater(storage, savedCart).execute({ productId: 'p-1' })

    expect(!result.ok && result.error.code).toBe('NETWORK')
    expect(await storage.load()).toEqual([aCartLine()])
    expect(storage.saves).toBe(0)
  })

  it('falla con NOT_FOUND si la línea ya no está en la cesta', async () => {
    const storage = new FakeCartStorage([aCartLine()])
    const savedCart = new FakeSavedCartRepository()

    const result = await new SaveForLater(storage, savedCart).execute({ productId: 'p-9' })

    expect(!result.ok && result.error.code).toBe('NOT_FOUND')
    expect(savedCart.savedLines).toEqual([])
  })

  it('guarda solo la variante indicada', async () => {
    const storage = new FakeCartStorage([
      aCartLine({ variantId: 'v-1' }),
      aCartLine({ variantId: 'v-2' }),
    ])
    const savedCart = new FakeSavedCartRepository()

    const result = await new SaveForLater(storage, savedCart).execute({
      productId: 'p-1',
      variantId: 'v-2',
    })

    expect(savedCart.savedLines[0]?.variantId).toBe('v-2')
    expect(result.ok && result.value.lines).toEqual([aCartLine({ variantId: 'v-1' })])
  })
})
