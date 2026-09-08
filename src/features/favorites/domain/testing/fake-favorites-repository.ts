import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'
import { Page } from '@features/catalog/domain/entities/page'
import { ProductSummary } from '@features/catalog/domain/entities/product'

import { FavoritesRepository } from '../ports/favorites-repository'

interface Config {
  ids?: string[]
  /** Los productos que devuelve `list()`. Vacío por defecto: la mayoría de pruebas solo miran los ids. */
  products?: ProductSummary[]
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

  async list(page: number, size: number): Promise<Result<Page<ProductSummary>, AppError>> {
    if (this.config.error) return err(this.config.error)
    const items = this.config.products ?? []
    return ok({
      items,
      page,
      size,
      totalElements: items.length,
      totalPages: items.length === 0 ? 0 : 1,
    })
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
