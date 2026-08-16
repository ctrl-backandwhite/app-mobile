import { AppError } from '@core/errors/app-error'
import { mapHttpError } from '@core/errors/http-error-mapper'
import { HttpClient } from '@core/http/http-client'
import { err, ok, Result } from '@core/result/result'
import { CartLine } from '@features/cart/domain/entities/cart-line'
import { CartMerger } from '@features/cart/domain/ports/cart-merger'

import { cartLinesDto } from '../dto/cart.dto'
import { toCartLine, toCartLinePayload } from '../mappers/cart-line.mapper'

export class HttpCartMerger implements CartMerger {
  constructor(private readonly http: HttpClient) {}

  async merge(lines: readonly CartLine[]): Promise<Result<CartLine[], AppError>> {
    try {
      const raw = await this.http.post('/me/cart/merge', lines.map(toCartLinePayload))
      return ok(cartLinesDto.parse(raw).map(toCartLine))
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return err(new AppError('CONTRACT', 'La respuesta de la cesta no tiene el formato esperado.'))
      }
      return err(mapHttpError(error))
    }
  }
}
