import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { CartLine, findLine, LineRef, removeLine } from '../entities/cart-line'
import { CartStorage } from '../ports/cart-storage'
import { SavedCartRepository } from '../ports/saved-cart-repository'

/** Las dos listas después de mover una línea de una a otra. */
export interface CartTransfer {
  readonly lines: CartLine[]
  readonly saved: CartLine[]
}

export class SaveForLater {
  constructor(
    private readonly storage: CartStorage,
    private readonly savedCart: SavedCartRepository,
  ) {}

  /**
   * Aparta una línea de la cesta local y la guarda en la cuenta.
   *
   * El orden importa: primero se confirma en el backend y solo después se quita de la cesta. Al
   * revés, un fallo de red haría desaparecer la línea de los dos sitios y la persona perdería lo que
   * había elegido sin saber por qué.
   */
  async execute(ref: LineRef): Promise<Result<CartTransfer, AppError>> {
    const lines = await this.storage.load()
    const line = findLine(lines, ref)
    if (!line) return err(new AppError('NOT_FOUND', 'Esa línea ya no está en la cesta.'))

    const result = await this.savedCart.save(line)
    if (!result.ok) return result

    const remaining = removeLine(lines, ref)
    await this.storage.save(remaining)
    return ok({ lines: remaining, saved: result.value })
  }
}
