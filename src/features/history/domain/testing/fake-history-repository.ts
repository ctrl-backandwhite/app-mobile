import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'
import { Page } from '@features/catalog/domain/entities/page'
import { ProductSummary } from '@features/catalog/domain/entities/product'

import { HistoryRepository } from '../ports/history-repository'

interface Config {
  page?: Page<ProductSummary>
  error?: AppError
}

const VACIA: Page<ProductSummary> = { items: [], page: 0, size: 0, totalElements: 0, totalPages: 0 }

export class FakeHistoryRepository implements HistoryRepository {
  recorded: string[] = []

  constructor(private readonly config: Config = {}) {}

  async list(): Promise<Result<Page<ProductSummary>, AppError>> {
    if (this.config.error) return err(this.config.error)
    return ok(this.config.page ?? VACIA)
  }

  async record(productId: string): Promise<Result<void, AppError>> {
    this.recorded.push(productId)
    if (this.config.error) return err(this.config.error)
    return ok(undefined)
  }
}
