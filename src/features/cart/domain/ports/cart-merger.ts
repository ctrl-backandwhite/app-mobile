import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { CartLine } from '../entities/cart-line'

/** Funde una cesta con la que ya haya en la cuenta, sumando las cantidades de las líneas repetidas. */
export interface CartMerger {
  merge(lines: readonly CartLine[]): Promise<Result<CartLine[], AppError>>
}
