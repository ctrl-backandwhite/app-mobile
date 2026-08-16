import { z } from 'zod'

import { AppError } from '@core/errors/app-error'
import { mapHttpError } from '@core/errors/http-error-mapper'
import { HttpClient } from '@core/http/http-client'
import { err, ok, Result } from '@core/result/result'
import { FavoritesRepository } from '@features/favorites/domain/ports/favorites-repository'

const idsDto = z.array(z.string())

export class HttpFavoritesRepository implements FavoritesRepository {
  constructor(private readonly http: HttpClient) {}

  async ids(): Promise<Result<string[], AppError>> {
    try {
      return ok(idsDto.parse(await this.http.get('/me/favorites/ids')))
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return err(new AppError('CONTRACT', 'La respuesta de favoritos no tiene el formato esperado.'))
      }
      return err(mapHttpError(error))
    }
  }

  async add(productId: string): Promise<Result<void, AppError>> {
    try {
      await this.http.post(`/me/favorites/${productId}`)
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  }

  async remove(productId: string): Promise<Result<void, AppError>> {
    try {
      await this.http.delete(`/me/favorites/${productId}`)
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  }
}
