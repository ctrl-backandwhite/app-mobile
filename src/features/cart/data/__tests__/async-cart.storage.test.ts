import { InMemoryStore } from '@core/storage/in-memory.adapter'
import { aCartLine } from '@features/cart/domain/testing/cart-builders'

import { AsyncCartStorage } from '../repositories/async-cart.storage'

const CART_KEY = 'nx036.cart'

describe('AsyncCartStorage', () => {
  it('guarda y recupera la cesta', async () => {
    const storage = new AsyncCartStorage(new InMemoryStore())
    const lines = [aCartLine({ quantity: 2, moq: 2 }), aCartLine({ productId: 'p-2', variantId: 'v-1' })]

    await storage.save(lines)

    expect(await storage.load()).toEqual(lines)
  })

  it('devuelve una cesta vacía cuando no hay nada guardado', async () => {
    expect(await new AsyncCartStorage(new InMemoryStore()).load()).toEqual([])
  })

  it('devuelve una cesta vacía si el JSON está corrupto', async () => {
    const preferences = new InMemoryStore()
    await preferences.set(CART_KEY, '{esto no es JSON')

    expect(await new AsyncCartStorage(preferences).load()).toEqual([])
  })

  it('devuelve una cesta vacía si lo guardado no es una lista de líneas', async () => {
    const preferences = new InMemoryStore()
    await preferences.set(CART_KEY, JSON.stringify({ lines: [aCartLine()] }))

    expect(await new AsyncCartStorage(preferences).load()).toEqual([])
  })

  it('descarta una línea sin identificador de producto en lugar de arrastrarla', async () => {
    const preferences = new InMemoryStore()
    await preferences.set(CART_KEY, JSON.stringify([{ title: 'Sin id' }]))

    expect(await new AsyncCartStorage(preferences).load()).toEqual([])
  })

  it('ignora el precio que dejó una versión anterior y completa lo que falta', async () => {
    const preferences = new InMemoryStore()
    await preferences.set(
      CART_KEY,
      JSON.stringify([{ productId: 'p-1', variantId: null, unitPriceSource: 117, sourceCurrency: 'CNY' }]),
    )

    const lines = await new AsyncCartStorage(preferences).load()

    expect(lines).toEqual([{ productId: 'p-1', slug: '', title: '', quantity: 1 }])
    expect(Object.keys(lines[0] ?? {})).not.toContain('unitPriceSource')
  })

  it('vacía la cesta al limpiar', async () => {
    const preferences = new InMemoryStore()
    const storage = new AsyncCartStorage(preferences)
    await storage.save([aCartLine()])

    await storage.clear()

    expect(await preferences.get(CART_KEY)).toBeNull()
    expect(await storage.load()).toEqual([])
  })
})
