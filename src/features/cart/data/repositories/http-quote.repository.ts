import { AppError } from '@core/errors/app-error'
import { mapHttpError } from '@core/errors/http-error-mapper'
import { HttpClient } from '@core/http/http-client'
import { err, ok, Result } from '@core/result/result'
import { CartQuote } from '@features/cart/domain/entities/cart-quote'
import { QuoteItem, QuoteRepository } from '@features/cart/domain/ports/quote-repository'

import { cartQuoteDto } from '../dto/cart.dto'
import { toCartQuote } from '../mappers/cart-quote.mapper'

function isSchemaViolation(error: unknown): boolean {
  return error instanceof Error && error.name === 'ZodError'
}

export class HttpQuoteRepository implements QuoteRepository {
  constructor(private readonly http: HttpClient) {}

  /**
   * Precio vigente de la cesta en la divisa activa, que la manda el interceptor en `X-Currency`.
   * El cuerpo es el ARRAY de artículos, no un objeto que los envuelva.
   */
  async quote(items: readonly QuoteItem[]): Promise<Result<CartQuote, AppError>> {
    try {
      return ok(toCartQuote(cartQuoteDto.parse(await this.http.post('/catalog/cart-quote', items))))
    } catch (error) {
      if (isSchemaViolation(error)) {
        return err(new AppError('CONTRACT', 'El presupuesto del servidor no tiene el formato esperado.'))
      }
      return err(mapHttpError(error))
    }
  }
}
