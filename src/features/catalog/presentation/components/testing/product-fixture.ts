import { ProductSummary } from '@features/catalog/domain/entities/product'

/**
 * Producto de ejemplo para las pruebas de los componentes.
 *
 * Vive en `testing/` y no en `__tests__/`: jest-expo trata cualquier fichero de `__tests__` como una
 * suite y un ayudante sin pruebas dentro fallaría con «your test suite must contain at least one test».
 */
export function aProduct(overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id: 'p-1',
    slug: 'chaqueta-cortavientos',
    title: 'Chaqueta cortavientos impermeable',
    mainImage: 'https://cdn.test/chaqueta.jpg',
    rating: 4.6,
    monthlySales: 1240,
    status: 'ACTIVE',
    displayFormatted: '24,90 €',
    dutyCovered: false,
    shippingCovered: false,
    ...overrides,
  }
}
