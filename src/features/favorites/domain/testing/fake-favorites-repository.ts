import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { FavoritesRepository } from '../ports/favorites-repository'

interface Config {
  ids?: string[]
  error?: AppError
}

export class FakeFavoritesRepository implements FavoritesRepository {
  added: string[] = []
  removed: string[] = []

  constructor(private readonly config: Config = {}) {}

  async ids(): Promise<Result<string[], AppError>> {
    if (this.config.error) return err(this.config.error)
    return ok(this.config.ids ?? [])
  }

  async add(productId: string): Promise<Result<void, AppError>> {
    this.added.push(productId)
    return this.config.error ? err(this.config.error) : ok(undefined)
  }

  async remove(productId: string): Promise<Result<void, AppError>> {
    this.removed.push(productId)
    return this.config.error ? err(this.config.error) : ok(undefined)
  }
}
