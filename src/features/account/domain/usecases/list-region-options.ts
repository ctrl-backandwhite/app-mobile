import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { Currency, Language } from '../entities/region'
import { RegionRepository } from '../ports/region-repository'

/** Los idiomas publicados. */
export class ListLanguages {
  constructor(private readonly repository: RegionRepository) {}

  execute(): Promise<Result<Language[], AppError>> {
    return this.repository.languages()
  }
}

/** Las divisas activas. */
export class ListCurrencies {
  constructor(private readonly repository: RegionRepository) {}

  execute(): Promise<Result<Currency[], AppError>> {
    return this.repository.currencies()
  }
}
