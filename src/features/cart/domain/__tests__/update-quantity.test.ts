import { aCartLine } from '../testing/cart-builders'
import { FakeCartStorage } from '../testing/fake-cart-storage'
import { UpdateQuantity } from '../usecases/update-quantity'

describe('UpdateQuantity', () => {
  it('cambia la cantidad de la línea indicada y deja las demás como estaban', async () => {
    const storage = new FakeCartStorage([
      aCartLine({ variantId: 'v-1', quantity: 1 }),
      aCartLine({ variantId: 'v-2', quantity: 4 }),
    ])

    const lines = await new UpdateQuantity(storage).execute({ productId: 'p-1', variantId: 'v-1' }, 7)

    expect(lines[0]?.quantity).toBe(7)
    expect(lines[1]?.quantity).toBe(4)
    expect(await storage.load()).toEqual(lines)
  })

  it('no deja bajar del pedido mínimo', async () => {
    const storage = new FakeCartStorage([aCartLine({ quantity: 10, moq: 5 })])

    const lines = await new UpdateQuantity(storage).execute({ productId: 'p-1' }, 2)

    expect(lines[0]?.quantity).toBe(5)
  })

  it('elimina la línea cuando se pide cantidad cero', async () => {
    const storage = new FakeCartStorage([aCartLine(), aCartLine({ productId: 'p-2' })])

    const lines = await new UpdateQuantity(storage).execute({ productId: 'p-1' }, 0)

    expect(lines).toHaveLength(1)
    expect(lines[0]?.productId).toBe('p-2')
  })

  it('una cantidad negativa también elimina la línea', async () => {
    const storage = new FakeCartStorage([aCartLine({ moq: 5 })])

    expect(await new UpdateQuantity(storage).execute({ productId: 'p-1' }, -3)).toEqual([])
  })

  it('no altera la cesta si la línea ya no está', async () => {
    const storage = new FakeCartStorage([aCartLine()])

    const lines = await new UpdateQuantity(storage).execute({ productId: 'p-9' }, 4)

    expect(lines).toEqual([aCartLine()])
  })
})
