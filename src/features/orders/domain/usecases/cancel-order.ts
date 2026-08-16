import { AppError } from '@core/errors/app-error'
import { err, Result } from '@core/result/result'

import { OrderDetail } from '../entities/order-detail'
import { OrdersRepository } from '../ports/orders-repository'

export class CancelOrder {
  constructor(private readonly repository: OrdersRepository) {}

  /**
   * `refundToWallet` por defecto manda el dinero a la billetera: es el destino inmediato y el único
   * que no depende de los plazos de un tercero. Quien pagó con tarjeta o PayPal puede pedir el
   * método original pasando `false`.
   */
  async execute(id: string, lang = 'es', refundToWallet = true): Promise<Result<OrderDetail, AppError>> {
    const clean = id.trim()
    if (clean.length === 0) {
      return err(new AppError('NOT_FOUND', 'No se ha encontrado el pedido solicitado.'))
    }
    return this.repository.cancel(clean, lang, refundToWallet)
  }
}
