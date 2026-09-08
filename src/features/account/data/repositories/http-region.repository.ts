import { AppError } from '@core/errors/app-error'
import { mapHttpError } from '@core/errors/http-error-mapper'
import { HttpClient } from '@core/http/http-client'
import { err, ok, Result } from '@core/result/result'
import { Currency, Language } from '@features/account/domain/entities/region'
import { RegionRepository } from '@features/account/domain/ports/region-repository'

import { currenciesDto, languagesDto } from '../dto/region.dto'

export class HttpRegionRepository implements RegionRepository {
  constructor(private readonly http: HttpClient) {}

  async languages(): Promise<Result<Language[], AppError>> {
    try {
      const filas = languagesDto.parse(await this.http.get('/languages'))
      return ok(
        filas
          // Un idioma desactivado sigue viajando en la respuesta; ofrecerlo dejaría la tienda a medio
          // traducir para quien lo eligiera.
          .filter((f) => f.active !== false)
          .map((f) => ({ code: f.code, label: f.label, flag: f.flag ?? '' })),
      )
    } catch (error) {
      return err(this.traduce(error))
    }
  }

  async currencies(): Promise<Result<Currency[], AppError>> {
    try {
      const filas = currenciesDto.parse(await this.http.get('/currency/rates'))
      return ok(
        filas
          .filter((f) => f.active !== false)
          .map((f) => ({
            code: f.code,
            name: f.name,
            symbol: f.symbol ?? f.code,
            flag: f.flagEmoji ?? '',
          })),
      )
    } catch (error) {
      return err(this.traduce(error))
    }
  }

  private traduce(error: unknown): AppError {
    if (error instanceof Error && error.name === 'ZodError') {
      return new AppError('CONTRACT', 'La respuesta de idiomas o divisas no tiene el formato esperado.')
    }
    return mapHttpError(error)
  }
}
