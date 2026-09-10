import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { HistoryRepository } from '../ports/history-repository'

/**
 * Anota que se ha abierto una ficha.
 *
 * <p>Un fallo aquí NO es un fallo de la pantalla: si el historial no se pudo anotar, la ficha se sigue
 * viendo igual y no hay nada que decirle a nadie. Por eso devuelve siempre bien y se traga el error;
 * la alternativa —un aviso rojo sobre el producto porque no se pudo guardar una estadística— sería
 * mucho peor que perder una anotación.
 */
export class RecordProductView {
  constructor(private readonly repository: HistoryRepository) {}

  async execute(productId: string): Promise<Result<void, AppError>> {
    if (productId.trim().length === 0) return ok(undefined)
    await this.repository.record(productId)
    return ok(undefined)
  }
}
