import { AppError } from '@core/errors/app-error'
import { mapHttpError } from '@core/errors/http-error-mapper'
import { HttpClient } from '@core/http/http-client'
import { err, ok, Result } from '@core/result/result'
import { CartLine } from '@features/cart/domain/entities/cart-line'
import { SavedCartRepository } from '@features/cart/domain/ports/saved-cart-repository'

import { cartLinesDto } from '../dto/cart.dto'
import { toCartLine } from '../mappers/cart-line.mapper'

/** Zod señala sus fallos con este nombre; comprobarlo evita acoplarse a la clase concreta. */
function isSchemaViolation(error: unknown): boolean {
  return error instanceof Error && error.name === 'ZodError'
}

/**
 * «Guardar para más tarde» del usuario autenticado. Cada operación devuelve la lista completa que
 * responde el backend, que es la fuente de verdad.
 */
export class HttpSavedCartRepository implements SavedCartRepository {
  constructor(private readonly http: HttpClient) {}

  private async call(operation: () => Promise<unknown>): Promise<Result<CartLine[], AppError>> {
    try {
      return ok(cartLinesDto.parse(await operation()).map(toCartLine))
    } catch (error) {
      if (isSchemaViolation(error)) {
        return err(new AppError('CONTRACT', 'La respuesta del servidor no tiene el formato esperado.'))
      }
      return err(mapHttpError(error))
    }
  }

  async list(): Promise<Result<CartLine[], AppError>> {
    return this.call(() => this.http.get('/me/saved-cart'))
  }

  async save(line: CartLine): Promise<Result<CartLine[], AppError>> {
    return this.call(() => this.http.put('/me/saved-cart', line))
  }

  async remove(productId: string, variantId?: string): Promise<Result<CartLine[], AppError>> {
    return this.call(() =>
      // El identificador va escapado porque forma parte de la ruta: sin escapar, un valor con barra
      // apuntaría a otro recurso.
      this.http.delete(`/me/saved-cart/${encodeURIComponent(productId)}`, {
        params: variantId ? { variantId } : {},
      }),
    )
  }

  async merge(lines: readonly CartLine[]): Promise<Result<CartLine[], AppError>> {
    return this.call(() => this.http.post('/me/saved-cart/merge', lines))
  }
}
