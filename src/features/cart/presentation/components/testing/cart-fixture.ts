import { CartLine } from '@features/cart/domain/entities/cart-line'
import { CartQuote, QuoteLine } from '@features/cart/domain/entities/cart-quote'

/**
 * Dobles de la cesta para las pruebas de los componentes.
 *
 * Viven en `testing/` y no en `__tests__/`: jest-expo trata cualquier fichero de `__tests__` como una
 * suite y un ayudante sin pruebas dentro fallaría con «your test suite must contain at least one test».
 */
export function aLine(overrides: Partial<CartLine> = {}): CartLine {
  return {
    productId: 'p-1',
    variantId: 'v-1',
    slug: 'chaqueta-cortavientos',
    title: 'Chaqueta cortavientos impermeable',
    image: 'https://cdn.test/chaqueta.jpg',
    variantLabel: 'Color: Negro / Talla: M',
    sku: 'NX-001',
    quantity: 2,
    ...overrides,
  }
}

export function aQuoteLine(overrides: Partial<QuoteLine> = {}): QuoteLine {
  return {
    productId: 'p-1',
    variantId: 'v-1',
    unitFormatted: '24,90 €',
    lineTotalFormatted: '49,80 €',
    ...overrides,
  }
}

export function aQuote(overrides: Partial<CartQuote> = {}): CartQuote {
  return {
    currency: 'EUR',
    symbol: '€',
    items: [aQuoteLine()],
    subtotalFormatted: '49,80 €',
    ...overrides,
  }
}
