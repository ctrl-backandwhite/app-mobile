import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { CartQuote } from '../entities/cart-quote'
import { QuoteItem, QuoteRepository } from '../ports/quote-repository'

interface Config {
  quote?: CartQuote
  error?: AppError
}

export class FakeQuoteRepository implements QuoteRepository {
  calls = 0
  lastItems: QuoteItem[] | null = null

  constructor(private readonly config: Config = {}) {}

  async quote(items: readonly QuoteItem[]): Promise<Result<CartQuote, AppError>> {
    this.calls += 1
    this.lastItems = [...items]
    if (this.config.error) return err(this.config.error)
    return ok(this.config.quote ?? { currency: 'EUR', symbol: '€', items: [] })
  }
}
