import { AppError } from '@core/errors/app-error'
import { err, Result } from '@core/result/result'

import { OrderDetail } from '../entities/order-detail'
import { OrdersRepository } from '../ports/orders-repository'

export class GetOrderDetail {
  constructor(private readonly repository: OrdersRepository) {}

  async execute(id: string, lang = 'es'): Promise<Result<OrderDetail, AppError>> {
    const clean = id.trim()
    // Un identificador vacío formaría la ruta del listado y devolvería el histórico entero donde se
    // espera un pedido; se corta aquí para que el fallo sea el mismo que el de un pedido inexistente.
    if (clean.length === 0) {
      return err(new AppError('NOT_FOUND', 'No se ha encontrado el pedido solicitado.'))
    }
    return this.repository.detail(clean, lang)
  }
}
