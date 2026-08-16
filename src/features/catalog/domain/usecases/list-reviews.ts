import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { Page } from '../entities/page'
import { Review } from '../entities/review'
import { CatalogRepository } from '../ports/catalog-repository'

/** Llena la pestaña de opiniones de una ficha sin encadenar peticiones nada más abrirla. */
const DEFAULT_SIZE = 20
/** Una petición de cientos de opiniones tarda más de lo que el usuario espera leyendo. */
const MAX_SIZE = 50
const MIN_SIZE = 1

export interface ListReviewsInput {
  readonly productId: string
  readonly page?: number
  readonly size?: number
}

export class ListReviews {
  constructor(private readonly repository: CatalogRepository) {}

  async execute(input: ListReviewsInput): Promise<Result<Page<Review>, AppError>> {
    const { productId, page = 0, size = DEFAULT_SIZE } = input
    return this.repository.reviews(productId, Math.max(Math.trunc(page), 0), this.clamp(size))
  }

  private clamp(size: number): number {
    return Math.min(Math.max(Math.trunc(size), MIN_SIZE), MAX_SIZE)
  }
}
