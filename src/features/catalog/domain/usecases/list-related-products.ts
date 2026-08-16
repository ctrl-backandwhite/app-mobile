import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { ProductSummary } from '../entities/product'
import { CatalogRepository } from '../ports/catalog-repository'

/** Los que caben en un carrusel horizontal de la ficha sin descargar fichas que nadie llega a ver. */
const DEFAULT_LIMIT = 8
const MAX_LIMIT = 24
const MIN_LIMIT = 1

export class ListRelatedProducts {
  constructor(private readonly repository: CatalogRepository) {}

  async execute(
    productId: string,
    lang = 'es',
    limit: number = DEFAULT_LIMIT,
  ): Promise<Result<ProductSummary[], AppError>> {
    const result = await this.repository.relatedProducts(productId, lang, this.clamp(limit))
    if (!result.ok) return result
    // El backend ya excluye el producto actual, pero la ficha se abre también desde este mismo
    // carrusel: si alguna vez colara, el usuario vería «relacionado» el producto que está mirando.
    return ok(result.value.filter((product) => product.id !== productId))
  }

  private clamp(limit: number): number {
    return Math.min(Math.max(Math.trunc(limit), MIN_LIMIT), MAX_LIMIT)
  }
}
