import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { FavoritesRepository } from '../ports/favorites-repository'

export class ListFavoriteIds {
  constructor(private readonly repository: FavoritesRepository) {}

  async execute(): Promise<Result<string[], AppError>> {
    return this.repository.ids()
  }
}
