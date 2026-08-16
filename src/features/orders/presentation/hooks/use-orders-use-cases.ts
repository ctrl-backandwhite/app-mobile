import { useContainer } from '@composition/container.provider'
import { CancelOrder } from '@features/orders/domain/usecases/cancel-order'
import { GetOrderDetail } from '@features/orders/domain/usecases/get-order-detail'
import { GetOrderTracking } from '@features/orders/domain/usecases/get-order-tracking'
import { ListOrders } from '@features/orders/domain/usecases/list-orders'

export interface OrdersUseCases {
  readonly listOrders: ListOrders
  readonly getOrderDetail: GetOrderDetail
  readonly getOrderTracking: GetOrderTracking
  readonly cancelOrder: CancelOrder
}

/** Casos de uso del histórico, resueltos del contenedor. */
export function useOrdersUseCases(): OrdersUseCases {
  return useContainer()
}
