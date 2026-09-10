import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'
import { Page } from '@features/catalog/domain/entities/page'
import { ProductSummary } from '@features/catalog/domain/entities/product'

import { HistoryRepository } from '../ports/history-repository'

interface Params {
  readonly page: number
  readonly size: number
  readonly lang: string
}

/** Lo último que se ha mirado, con la ficha resumida y ya en la divisa e idioma activos. */
export class ListViewedProducts {
  constructor(private readonly repository: HistoryRepository) {}

  async execute({ page, size, lang }: Params): Promise<Result<Page<ProductSummary>, AppError>> {
    return this.repository.list(page, size, lang)
  }
}
