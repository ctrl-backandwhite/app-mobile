import { Order } from '@features/orders/domain/entities/order'
import { OrderAddress, OrderDetail, OrderItem } from '@features/orders/domain/entities/order-detail'

import { OrderAddressDto, OrderDetailDto, OrderItemDto, OrderRowDto } from '../dto/orders.dto'

/**
 * El backend distingue «campo ausente» de «campo a null», y el dominio no: las dos cosas significan
 * lo mismo —no hay dato— y se unifican aquí para que las pantallas solo tengan que preguntar por
 * `undefined`.
 */
function optional(value: string | null | undefined): string | undefined {
  return value ?? undefined
}

/**
 * Traduce el pedido del backend a la entidad del dominio. Solo se copian los campos que la
 * aplicación pinta: los importes numéricos que la API también expone se quedan fuera a propósito,
 * porque el importe que se muestra es siempre el ya formateado por el backend.
 */
export function toOrder(dto: OrderRowDto): Order {
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    status: dto.status,
    totalFormatted: optional(dto.totalFormatted),
    currency: dto.currency,
    itemCount: dto.itemCount,
    placedAt: dto.placedAt,
    shippedAt: optional(dto.shippedAt),
    deliveredAt: optional(dto.deliveredAt),
    paymentMethod: optional(dto.paymentMethod),
  }
}

export function toOrderAddress(dto: OrderAddressDto): OrderAddress {
  return {
    fullName: dto.fullName,
    phone: optional(dto.phone),
    email: optional(dto.email),
    line1: dto.line1,
    line2: optional(dto.line2),
    city: dto.city,
    state: optional(dto.state),
    postalCode: optional(dto.postalCode),
    country: dto.country,
  }
}

export function toOrderItem(dto: OrderItemDto): OrderItem {
  return {
    id: dto.id,
    productId: dto.productId,
    variantId: optional(dto.variantId),
    productTitle: dto.productTitle,
    variantName: optional(dto.variantName),
    imageUrl: optional(dto.imageUrl),
    quantity: dto.quantity,
    unitPriceFormatted: optional(dto.unitPriceFormatted),
    lineTotalFormatted: optional(dto.lineTotalFormatted),
  }
}

export function toOrderDetail(dto: OrderDetailDto): OrderDetail {
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    status: dto.status,
    paymentMethod: optional(dto.paymentMethod),
    currency: dto.currency,
    subtotalFormatted: optional(dto.subtotalFormatted),
    shippingFormatted: optional(dto.shippingFormatted),
    customsDutyFormatted: optional(dto.customsDutyFormatted),
    taxFormatted: optional(dto.taxFormatted),
    totalFormatted: optional(dto.totalFormatted),
    discountFormatted: optional(dto.discountFormatted),
    shippingAddress: dto.shippingAddress ? toOrderAddress(dto.shippingAddress) : undefined,
    notes: optional(dto.notes),
    trackingCarrier: optional(dto.trackingCarrier),
    trackingNumber: optional(dto.trackingNumber),
    placedAt: optional(dto.placedAt),
    shippedAt: optional(dto.shippedAt),
    deliveredAt: optional(dto.deliveredAt),
    cancelledAt: optional(dto.cancelledAt),
    items: dto.items.map(toOrderItem),
  }
}
