/**
 * Constructores de datos para las pruebas de la cesta.
 *
 * Viven fuera de `__tests__` porque el `testMatch` de jest-expo trata como suite cualquier fichero
 * bajo esa carpeta, y un módulo sin `it` rompe la ejecución.
 */
import { CartLine } from '../entities/cart-line'
import { CartQuote } from '../entities/cart-quote'

export function aCartLine(overrides: Partial<CartLine> = {}): CartLine {
  return {
    productId: 'p-1',
    slug: 'camiseta-basica',
    title: 'Camiseta básica',
    image: 'https://cdn.nx036.com/p-1.jpg',
    quantity: 1,
    ...overrides,
  }
}

export function aCartQuote(overrides: Partial<CartQuote> = {}): CartQuote {
  return {
    currency: 'EUR',
    symbol: '€',
    items: [{ productId: 'p-1', unitFormatted: '12,90 €', lineTotalFormatted: '12,90 €' }],
    subtotalFormatted: '12,90 €',
    ...overrides,
  }
}
