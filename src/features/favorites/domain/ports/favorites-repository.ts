import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'
import { Page } from '@features/catalog/domain/entities/page'
import { ProductSummary } from '@features/catalog/domain/entities/product'

export interface FavoritesRepository {
  /** Identificadores de los productos marcados. Se piden de una vez para poder pintar el estado
   *  de cada tarjeta sin una llamada por producto. */
  ids(): Promise<Result<string[], AppError>>

  /**
   * Los productos marcados, con su ficha resumida y paginados.
   *
   * <p>Es una lectura DISTINTA de `ids()` y las dos hacen falta. Los identificadores se piden una vez
   * al arrancar para poder pintar el corazón de cada tarjeta del catálogo sin una llamada por producto;
   * esto trae los productos enteros, que es lo que necesita la pantalla de favoritos para enseñarlos.
   * Pedir aquí los identificadores y luego una ficha por cada uno serían N llamadas para pintar una
   * lista.
   */
  list(page: number, size: number, lang: string): Promise<Result<Page<ProductSummary>, AppError>>
  add(productId: string): Promise<Result<void, AppError>>
  remove(productId: string): Promise<Result<void, AppError>>
}
