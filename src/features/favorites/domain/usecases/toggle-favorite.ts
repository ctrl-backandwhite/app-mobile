import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { FavoritesRepository } from '../ports/favorites-repository'

export class ToggleFavorite {
  constructor(private readonly repository: FavoritesRepository) {}

  /**
   * Marca o desmarca, según el estado que se le indique, y devuelve el estado resultante.
   *
   * Recibe `isFavorite` en vez de consultarlo: quien llama ya lo sabe —lo está pintando— y
   * preguntarlo aquí añadiría una ida y vuelta a la red antes de poder responder al toque.
   */
  async execute(productId: string, isFavorite: boolean): Promise<Result<boolean, AppError>> {
    const result = isFavorite
      ? await this.repository.remove(productId)
      : await this.repository.add(productId)

    if (!result.ok) return result
    return ok(!isFavorite)
  }
}
