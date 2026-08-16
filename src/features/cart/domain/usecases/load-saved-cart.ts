import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { CartLine } from '../entities/cart-line'
import { SavedCartRepository } from '../ports/saved-cart-repository'

/**
 * Lista lo guardado para más tarde.
 *
 * Vive en el servidor, ligado a la cuenta: es lo que hace que apartar un producto desde el panel web
 * aparezca también en el móvil.
 */
export class LoadSavedCart {
  constructor(private readonly repository: SavedCartRepository) {}

  async execute(): Promise<Result<CartLine[], AppError>> {
    return this.repository.list()
  }
}
