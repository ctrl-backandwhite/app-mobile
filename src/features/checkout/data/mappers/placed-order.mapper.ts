import { PlacedOrder } from '@features/checkout/domain/entities/placed-order'

import { PlacedOrderDto } from '../dto/checkout.dto'

import { text } from '@core/data/nullable'

export function toPlacedOrder(dto: PlacedOrderDto): PlacedOrder {
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    status: dto.status,
    paymentMethod: text(dto.paymentMethod),
    totalFormatted: text(dto.totalFormatted),
    // El enlace de aprobación viaja con dos nombres según el endpoint que lo emita; se acepta el que
    // llegue para que el pago externo no dependa de cuál acabe usando el backend.
    approvalUrl: text(dto.approvalUrl) ?? text(dto.approveUrl),
  }
}
