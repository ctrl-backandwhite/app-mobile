import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { CartLine } from '../entities/cart-line'

/**
 * «Guardar para más tarde» del usuario autenticado. Vive en el BACKEND porque está ligado a la
 * cuenta y se comparte entre dispositivos: lo que se aparta en el móvil aparece en el escritorio.
 *
 * Todas las operaciones devuelven la lista COMPLETA resultante, que es la fuente de verdad: así la
 * app no reconstruye el estado a partir de lo que creía tener antes de la llamada.
 */
export interface SavedCartRepository {
  list(): Promise<Result<CartLine[], AppError>>
  save(line: CartLine): Promise<Result<CartLine[], AppError>>
  remove(productId: string, variantId?: string): Promise<Result<CartLine[], AppError>>
  /** Sube los guardados del invitado al iniciar sesión; el backend los fusiona con los suyos. */
  merge(lines: readonly CartLine[]): Promise<Result<CartLine[], AppError>>
}
