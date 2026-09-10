import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'
import { Page } from '@features/catalog/domain/entities/page'
import { ProductSummary } from '@features/catalog/domain/entities/product'

/**
 * Las fichas que la persona ha abierto, de la más reciente a la más antigua.
 *
 * <p>El historial lo lleva el servidor y no el teléfono: es el MISMO que se ve en la web y el que
 * alimenta el correo de recordatorio. Guardarlo aquí daría dos historiales distintos —uno por
 * aparato— y el correo hablaría de productos que en la aplicación no aparecen.
 */
export interface HistoryRepository {
  list(page: number, size: number, lang: string): Promise<Result<Page<ProductSummary>, AppError>>

  /**
   * Anota que se ha abierto una ficha. El servidor consolida por producto, así que volver a entrar
   * en la misma no acumula filas: solo adelanta la fecha.
   */
  record(productId: string): Promise<Result<void, AppError>>
}
