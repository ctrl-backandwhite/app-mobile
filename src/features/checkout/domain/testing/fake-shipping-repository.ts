import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { Region, ShippingQuote, SupportedCountry } from '../entities/shipping'
import { ShippingQuoteQuery, ShippingRepository } from '../ports/shipping-repository'

import { aShippingQuote } from './checkout-builders'

interface Config {
  quote?: ShippingQuote
  regions?: Region[]
  countries?: SupportedCountry[]
  error?: AppError
}

export class FakeShippingRepository implements ShippingRepository {
  quoteCalls = 0
  lastQuery: ShippingQuoteQuery | null = null
  lastCountry: string | null = null

  constructor(private readonly config: Config = {}) {}

  async quote(query: ShippingQuoteQuery): Promise<Result<ShippingQuote, AppError>> {
    this.quoteCalls += 1
    this.lastQuery = query
    if (this.config.error) return err(this.config.error)
    return ok(this.config.quote ?? aShippingQuote())
  }

  async regions(country: string): Promise<Result<Region[], AppError>> {
    this.lastCountry = country
    if (this.config.error) return err(this.config.error)
    return ok([...(this.config.regions ?? [])])
  }

  async countries(): Promise<Result<SupportedCountry[], AppError>> {
    if (this.config.error) return err(this.config.error)
    return ok([...(this.config.countries ?? [])])
  }
}
