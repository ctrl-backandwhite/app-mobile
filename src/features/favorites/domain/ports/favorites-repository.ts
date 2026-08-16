import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

export interface FavoritesRepository {
  /** Identificadores de los productos marcados. Se piden de una vez para poder pintar el estado
   *  de cada tarjeta sin una llamada por producto. */
  ids(): Promise<Result<string[], AppError>>
  add(productId: string): Promise<Result<void, AppError>>
  remove(productId: string): Promise<Result<void, AppError>>
}
