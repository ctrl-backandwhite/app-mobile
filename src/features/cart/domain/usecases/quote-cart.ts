import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { CartLine } from '../entities/cart-line'
import { CartQuote } from '../entities/cart-quote'
import { QuoteItem, QuoteRepository } from '../ports/quote-repository'

export class QuoteCart {
  constructor(private readonly quotes: QuoteRepository) {}

  /**
   * Pide al backend el precio VIGENTE de la cesta. Es el único importe que se pinta: la línea local
   * no guarda precio, así que lo que se enseña siempre coincide con lo que se cobra.
   *
   * Con la cesta vacía devuelve `null` sin llamar: presupuestar nada es una petición tirada que
   * además dejaría la pantalla en «cargando» mientras va y viene.
   */
  async execute(lines: readonly CartLine[]): Promise<Result<CartQuote | null, AppError>> {
    if (lines.length === 0) return ok(null)
    const items: QuoteItem[] = lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
    }))
    return this.quotes.quote(items)
  }
}
