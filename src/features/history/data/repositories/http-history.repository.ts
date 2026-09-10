import { AppError } from '@core/errors/app-error'
import { mapHttpError } from '@core/errors/http-error-mapper'
import { HttpClient } from '@core/http/http-client'
import { err, ok, Result } from '@core/result/result'
import { productPageDto } from '@features/catalog/data/dto/catalog.dto'
import { toProductPage } from '@features/catalog/data/mappers/product.mapper'
import { Page } from '@features/catalog/domain/entities/page'
import { ProductSummary } from '@features/catalog/domain/entities/product'
import { HistoryRepository } from '@features/history/domain/ports/history-repository'

export class HttpHistoryRepository implements HistoryRepository {
  constructor(private readonly http: HttpClient) {}

  /**
   * Se lee del MISMO endpoint que la página «lo que has visto» de la web y se traduce con el MISMO
   * mapeador del catálogo: lo visitado es un producto, y describirlo dos veces sería la forma segura
   * de que las dos descripciones acabaran discrepando.
   */
  async list(page: number, size: number, lang: string): Promise<Result<Page<ProductSummary>, AppError>> {
    try {
      const raw = await this.http.get('/me/product-views', { params: { page, size, lang } })
      return ok(toProductPage(productPageDto.parse(raw)))
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return err(new AppError('CONTRACT', 'La respuesta del historial no tiene el formato esperado.'))
      }
      return err(mapHttpError(error))
    }
  }

  async record(productId: string): Promise<Result<void, AppError>> {
    try {
      await this.http.post(`/me/product-views/${productId}`)
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  }
}
