import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { Order } from '../entities/order'
import { OrdersRepository } from '../ports/orders-repository'

export class ListOrders {
  constructor(private readonly repository: OrdersRepository) {}

  async execute(): Promise<Result<Order[], AppError>> {
    return this.repository.list()
  }
}
