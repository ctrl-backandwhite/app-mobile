import {
  findLine,
  minimumQuantity,
  removeLine,
  sameLine,
  totalUnits,
  upsertLine,
  withQuantity,
} from '../entities/cart-line'
import { aCartLine } from '../testing/cart-builders'

describe('CartLine', () => {
  it('reconoce la misma línea por producto y variante', () => {
    expect(sameLine({ productId: 'p-1', variantId: 'v-1' }, { productId: 'p-1', variantId: 'v-1' })).toBe(
      true,
    )
  })

  it('trata dos variantes del mismo producto como líneas distintas', () => {
    expect(sameLine({ productId: 'p-1', variantId: 'v-1' }, { productId: 'p-1', variantId: 'v-2' })).toBe(
      false,
    )
  })

  it('trata la variante ausente y la vacía como la misma', () => {
    expect(sameLine({ productId: 'p-1' }, { productId: 'p-1', variantId: '' })).toBe(true)
  })

  it('distingue una línea con variante de la misma sin ella', () => {
    expect(sameLine({ productId: 'p-1' }, { productId: 'p-1', variantId: 'v-1' })).toBe(false)
  })

  it('el mínimo es uno cuando no hay pedido mínimo o no tiene sentido', () => {
    expect(minimumQuantity({})).toBe(1)
    expect(minimumQuantity({ moq: 0 })).toBe(1)
    expect(minimumQuantity({ moq: 5 })).toBe(5)
  })

  it('no deja bajar la cantidad del pedido mínimo', () => {
    expect(withQuantity(aCartLine({ moq: 4 }), 2).quantity).toBe(4)
  })

  it('acepta una cantidad por encima del pedido mínimo', () => {
    expect(withQuantity(aCartLine({ moq: 4 }), 9).quantity).toBe(9)
  })

  it('descarta la parte fraccionaria de la cantidad', () => {
    expect(withQuantity(aCartLine(), 3.7).quantity).toBe(3)
  })

  it('suma las unidades de todas las líneas', () => {
    expect(totalUnits([aCartLine({ quantity: 2 }), aCartLine({ productId: 'p-2', quantity: 3 })])).toBe(5)
  })

  it('la cesta vacía no tiene unidades', () => {
    expect(totalUnits([])).toBe(0)
  })

  it('añade la línea nueva al final respetando su pedido mínimo', () => {
    const lines = upsertLine([aCartLine()], aCartLine({ productId: 'p-2', quantity: 1, moq: 3 }))

    expect(lines).toHaveLength(2)
    expect(lines[1]?.quantity).toBe(3)
  })

  it('suma las unidades cuando la línea ya estaba', () => {
    const lines = upsertLine([aCartLine({ quantity: 2 })], aCartLine({ quantity: 3 }))

    expect(lines).toHaveLength(1)
    expect(lines[0]?.quantity).toBe(5)
  })

  it('al fusionar conserva los datos previos que la línea nueva no trae', () => {
    const previous = aCartLine({ quantity: 1, sku: 'SKU-1', variantLabel: 'Rojo', moq: 2 })
    const incoming = aCartLine({ quantity: 1, image: undefined, sku: undefined, variantLabel: undefined })

    const lines = upsertLine([previous], incoming)

    expect(lines[0]?.sku).toBe('SKU-1')
    expect(lines[0]?.variantLabel).toBe('Rojo')
    expect(lines[0]?.image).toBe('https://cdn.nx036.com/p-1.jpg')
    expect(lines[0]?.moq).toBe(2)
  })

  it('al fusionar no toca las demás líneas y acepta los datos nuevos', () => {
    const lines = upsertLine(
      [aCartLine({ productId: 'p-2', quantity: 4 }), aCartLine({ quantity: 1 })],
      aCartLine({ quantity: 1, sku: 'SKU-9', variantLabel: 'Azul', image: 'https://cdn/n.jpg', moq: 2 }),
    )

    expect(lines[0]).toEqual(aCartLine({ productId: 'p-2', quantity: 4 }))
    expect(lines[1]?.quantity).toBe(2)
    expect(lines[1]?.sku).toBe('SKU-9')
    expect(lines[1]?.variantLabel).toBe('Azul')
    expect(lines[1]?.image).toBe('https://cdn/n.jpg')
    expect(lines[1]?.moq).toBe(2)
  })

  it('encuentra y quita solo la variante indicada', () => {
    const lines = [aCartLine({ variantId: 'v-1' }), aCartLine({ variantId: 'v-2' })]

    expect(findLine(lines, { productId: 'p-1', variantId: 'v-2' })?.variantId).toBe('v-2')
    expect(removeLine(lines, { productId: 'p-1', variantId: 'v-1' })).toEqual([
      aCartLine({ variantId: 'v-2' }),
    ])
  })

  it('no encuentra una línea que no está', () => {
    expect(findLine([aCartLine()], { productId: 'p-9' })).toBeUndefined()
  })
})
