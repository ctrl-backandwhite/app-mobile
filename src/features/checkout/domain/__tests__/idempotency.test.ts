import { checkoutIdempotencyKey } from '../policies/idempotency'
import { aCheckoutItem } from '../testing/checkout-builders'

describe('clave de idempotencia', () => {
  it('es la misma para la misma cesta', () => {
    // Es lo que evita el doble cobro: la conexión se corta, la persona vuelve a pulsar y el backend
    // reconoce el intento en vez de crear otro pedido.
    const items = [aCheckoutItem(), aCheckoutItem({ productId: 'p-2', variantId: 'v-2' })]

    expect(checkoutIdempotencyKey(items)).toBe(checkoutIdempotencyKey([...items]))
  })

  it('no depende del orden de las líneas', () => {
    const uno = aCheckoutItem({ productId: 'p-1' })
    const dos = aCheckoutItem({ productId: 'p-2' })

    expect(checkoutIdempotencyKey([uno, dos])).toBe(checkoutIdempotencyKey([dos, uno]))
  })

  it('cambia si cambia la cantidad', () => {
    const antes = checkoutIdempotencyKey([aCheckoutItem({ quantity: 1 })])
    const despues = checkoutIdempotencyKey([aCheckoutItem({ quantity: 2 })])

    expect(antes).not.toBe(despues)
  })

  it('cambia si cambia la variante', () => {
    const sinVariante = checkoutIdempotencyKey([aCheckoutItem({ variantId: undefined })])
    const conVariante = checkoutIdempotencyKey([aCheckoutItem({ variantId: 'v-1' })])

    expect(sinVariante).not.toBe(conVariante)
  })

  it('cambia si se añade una línea', () => {
    const una = checkoutIdempotencyKey([aCheckoutItem()])
    const dos = checkoutIdempotencyKey([aCheckoutItem(), aCheckoutItem({ productId: 'p-2' })])

    expect(una).not.toBe(dos)
  })

  it('cabe en una cabecera y no viaja vacía', () => {
    const key = checkoutIdempotencyKey([aCheckoutItem()])

    expect(key).toMatch(/^cart-[0-9a-z]+-1$/)
    expect(checkoutIdempotencyKey([])).toMatch(/^cart-[0-9a-z]+-0$/)
  })
})
