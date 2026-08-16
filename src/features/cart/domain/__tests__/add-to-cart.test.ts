import { aCartLine } from '../testing/cart-builders'
import { FakeCartStorage } from '../testing/fake-cart-storage'
import { AddToCart } from '../usecases/add-to-cart'

describe('AddToCart', () => {
  it('añade la primera línea y la persiste', async () => {
    const storage = new FakeCartStorage()
    const add = new AddToCart(storage)

    const lines = await add.execute(aCartLine({ quantity: 2 }))

    expect(lines).toHaveLength(1)
    expect(lines[0]?.quantity).toBe(2)
    expect(await storage.load()).toEqual(lines)
  })

  it('suma las unidades al añadir dos veces lo mismo', async () => {
    const storage = new FakeCartStorage()
    const add = new AddToCart(storage)

    await add.execute(aCartLine({ quantity: 2 }))
    const lines = await add.execute(aCartLine({ quantity: 3 }))

    expect(lines).toHaveLength(1)
    expect(lines[0]?.quantity).toBe(5)
  })

  it('trata dos variantes del mismo producto como líneas distintas', async () => {
    const storage = new FakeCartStorage()
    const add = new AddToCart(storage)

    await add.execute(aCartLine({ variantId: 'v-1', variantLabel: 'Rojo' }))
    const lines = await add.execute(aCartLine({ variantId: 'v-2', variantLabel: 'Azul' }))

    expect(lines).toHaveLength(2)
    expect(lines.map((line) => line.variantId)).toEqual(['v-1', 'v-2'])
  })

  it('sube al pedido mínimo una cantidad que se queda corta', async () => {
    const storage = new FakeCartStorage()

    const lines = await new AddToCart(storage).execute(aCartLine({ quantity: 1, moq: 6 }))

    expect(lines[0]?.quantity).toBe(6)
  })
})
