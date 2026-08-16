import { hasNextPage } from '../entities/page'
import { hasDiscount } from '../entities/product'
import { aPage, aProduct } from '../testing/fake-catalog-repository'

describe('hasDiscount', () => {
  it('hay rebaja cuando llegan el precio anterior y el porcentaje', () => {
    expect(hasDiscount(aProduct({ originalFormatted: '19,90 €', discountPercent: 35 }))).toBe(true)
  })

  it('no hay rebaja sin precio anterior', () => {
    expect(hasDiscount(aProduct({ discountPercent: 35 }))).toBe(false)
  })

  it('no hay rebaja con precio anterior pero sin porcentaje', () => {
    expect(hasDiscount(aProduct({ originalFormatted: '19,90 €' }))).toBe(false)
  })

  it('no hay rebaja con un porcentaje de cero', () => {
    expect(hasDiscount(aProduct({ originalFormatted: '19,90 €', discountPercent: 0 }))).toBe(false)
  })

  it('no hay rebaja en un producto sin promoción', () => {
    expect(hasDiscount(aProduct())).toBe(false)
  })
})

describe('hasNextPage', () => {
  it('hay siguiente mientras no se llegue a la última página', () => {
    expect(hasNextPage(aPage([aProduct()], { page: 0, totalPages: 3 }))).toBe(true)
  })

  it('no hay siguiente en la última página aunque venga llena', () => {
    expect(hasNextPage(aPage([aProduct()], { page: 2, totalPages: 3 }))).toBe(false)
  })

  it('no hay siguiente cuando no hay ninguna página', () => {
    expect(hasNextPage(aPage([]))).toBe(false)
  })
})
