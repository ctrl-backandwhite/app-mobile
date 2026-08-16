import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { Order } from '../entities/order'
import { OrderDetail } from '../entities/order-detail'
import { OrderTracking } from '../entities/tracking'

export interface OrdersRepository {
  /** El histórico completo del usuario. El backend ya lo devuelve del más reciente al más antiguo. */
  list(): Promise<Result<Order[], AppError>>
  /** `lang` decide el idioma de los títulos de producto, que se guardaron en chino al comprar. */
  detail(id: string, lang: string): Promise<Result<OrderDetail, AppError>>
  tracking(id: string): Promise<Result<OrderTracking, AppError>>
  /**
   * Cancelación por el propio cliente, con reembolso. `refundToWallet` elige el destino del dinero:
   * la billetera (inmediato) o el método original (tarjeta o PayPal, con sus plazos).
   */
  cancel(id: string, lang: string, refundToWallet: boolean): Promise<Result<OrderDetail, AppError>>
}
