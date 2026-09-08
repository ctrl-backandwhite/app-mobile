import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { Currency, Language } from '../entities/region'
import { RegionRepository } from '../ports/region-repository'

interface Config {
  languages?: Language[]
  currencies?: Currency[]
  error?: AppError
}

export class FakeRegionRepository implements RegionRepository {
  constructor(private readonly config: Config = {}) {}

  async languages(): Promise<Result<Language[], AppError>> {
    if (this.config.error) return err(this.config.error)
    return ok(this.config.languages ?? [{ code: 'es', label: 'Español', flag: '🇪🇸' }])
  }

  async currencies(): Promise<Result<Currency[], AppError>> {
    if (this.config.error) return err(this.config.error)
    return ok(this.config.currencies ?? [{ code: 'USD', name: 'Dólar', symbol: '$', flag: '🇺🇸' }])
  }
}
