import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'
import { Page } from '@features/catalog/domain/entities/page'
import { ProductSummary } from '@features/catalog/domain/entities/product'

import { FavoritesRepository } from '../ports/favorites-repository'

interface Params {
  readonly page: number
  readonly size: number
  readonly lang: string
}

/**
 * Los productos guardados, con su ficha resumida.
 *
 * <p>Distinto de `ListFavoriteIds`, y los dos hacen falta: aquel trae solo los identificadores, una vez
 * al arrancar, para que el corazón de cada tarjeta del catálogo salga pintado sin una llamada por
 * producto. Este trae los productos, que es lo que necesita la pantalla de guardados para enseñarlos.
 */
export class ListFavorites {
  constructor(private readonly repository: FavoritesRepository) {}

  async execute({ page, size, lang }: Params): Promise<Result<Page<ProductSummary>, AppError>> {
    return this.repository.list(page, size, lang)
  }
}
