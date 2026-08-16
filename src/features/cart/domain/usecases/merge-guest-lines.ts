import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { CartLine } from '../entities/cart-line'
import { CartMerger } from '../ports/cart-merger'

/**
 * Sube al servidor la cesta que quedó en el dispositivo antes de iniciar sesión.
 *
 * Las cantidades se suman con lo que ya hubiera en la cuenta: quien tenía tres unidades en el móvil
 * y dos en el navegador espera acabar con cinco, no perder unas u otras.
 *
 * Sin nada que fundir no se llama al servidor: subir una lista vacía no cambiaría nada y gastaría
 * una petición en cada arranque.
 */
export class MergeGuestLines {
  constructor(private readonly merger: CartMerger) {}

  async execute(guestLines: readonly CartLine[]): Promise<Result<CartLine[], AppError>> {
    if (guestLines.length === 0) return ok([])
    return this.merger.merge(guestLines)
  }
}
