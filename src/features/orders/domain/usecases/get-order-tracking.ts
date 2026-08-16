import { AppError } from '@core/errors/app-error'
import { err, Result } from '@core/result/result'

import { OrderTracking } from '../entities/tracking'
import { OrdersRepository } from '../ports/orders-repository'

export class GetOrderTracking {
  constructor(private readonly repository: OrdersRepository) {}

  async execute(id: string): Promise<Result<OrderTracking, AppError>> {
    const clean = id.trim()
    if (clean.length === 0) {
      return err(new AppError('NOT_FOUND', 'No se ha encontrado el pedido solicitado.'))
    }
    return this.repository.tracking(clean)
  }
}
