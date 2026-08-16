import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { CartLine } from '../entities/cart-line'
import { SavedCartRepository } from '../ports/saved-cart-repository'

export class MergeGuestCart {
  constructor(private readonly savedCart: SavedCartRepository) {}

  /**
   * Al iniciar sesión sube al backend lo que el invitado había guardado y devuelve la lista de la
   * cuenta ya fusionada.
   *
   * Sin nada que subir se pide la lista sin más: fusionar una lista vacía no cambia nada en el
   * servidor y la app necesita igualmente hidratar los guardados de la cuenta.
   */
  async execute(lines: readonly CartLine[]): Promise<Result<CartLine[], AppError>> {
    if (lines.length === 0) return this.savedCart.list()
    return this.savedCart.merge(lines)
  }
}
