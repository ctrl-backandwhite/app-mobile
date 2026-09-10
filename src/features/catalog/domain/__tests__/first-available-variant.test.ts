import { firstAvailableVariant } from '../entities/product-detail'
import { aProductDetail, aVariant } from '../testing/fake-catalog-repository'

describe('firstAvailableVariant', () => {
  it('devuelve la primera variante activa con existencias', () => {
    const detail = aProductDetail({
      variants: [
        aVariant({ id: 'v1', stock: 0 }),
        aVariant({ id: 'v2', stock: 5 }),
        aVariant({ id: 'v3', stock: 9 }),
      ],
    })

    expect(firstAvailableVariant(detail)?.id).toBe('v2')
  })

  it('salta las variantes desactivadas aunque tengan existencias', () => {
    const detail = aProductDetail({
      variants: [aVariant({ id: 'v1', stock: 7, active: false }), aVariant({ id: 'v2', stock: 3 })],
    })

    expect(firstAvailableVariant(detail)?.id).toBe('v2')
  })

  it('no devuelve ninguna cuando todas están agotadas', () => {
    const detail = aProductDetail({
      variants: [aVariant({ id: 'v1', stock: 0 }), aVariant({ id: 'v2', stock: 0 })],
    })

    expect(firstAvailableVariant(detail)).toBeUndefined()
  })

  it('no devuelve ninguna cuando el producto no tiene variantes', () => {
    // Sin ejes no hay nada que elegir: la línea va sin variante y eso es lo correcto.
    expect(firstAvailableVariant(aProductDetail({ variants: [] }))).toBeUndefined()
  })
})
