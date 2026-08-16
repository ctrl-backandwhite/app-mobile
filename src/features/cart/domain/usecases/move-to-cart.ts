import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { CartLine, upsertLine } from '../entities/cart-line'
import { CartStorage } from '../ports/cart-storage'
import { SavedCartRepository } from '../ports/saved-cart-repository'

import { CartTransfer } from './save-for-later'

export class MoveToCart {
  constructor(
    private readonly storage: CartStorage,
    private readonly savedCart: SavedCartRepository,
  ) {}

  /**
   * Devuelve a la cesta una línea guardada.
   *
   * Recibe la línea entera y no una referencia porque quien la pulsa ya la está pintando: buscarla
   * aquí obligaría a releer la lista guardada por red antes de poder responder al toque.
   *
   * Misma cautela que al guardar, en el sentido inverso: primero se confirma la baja en el backend y
   * solo entonces entra en la cesta. Si la llamada falla, la línea sigue guardada y no se pierde.
   */
  async execute(line: CartLine): Promise<Result<CartTransfer, AppError>> {
    const result = await this.savedCart.remove(line.productId, line.variantId)
    if (!result.ok) return result

    const lines = upsertLine(await this.storage.load(), line)
    await this.storage.save(lines)
    return ok({ lines, saved: result.value })
  }
}
