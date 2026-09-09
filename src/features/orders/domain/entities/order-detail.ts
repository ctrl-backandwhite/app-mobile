/** Dirección de entrega tal y como quedó grabada en el pedido. */
export interface OrderAddress {
  readonly fullName: string
  readonly phone?: string
  readonly email?: string
  readonly line1: string
  readonly line2?: string
  readonly city: string
  readonly state?: string
  readonly postalCode?: string
  readonly country: string
}

/**
 * Línea del pedido.
 *
 * De los importes solo se recoge lo YA formateado por el backend: la API manda además `unitPrice` y
 * `lineTotal` como cadenas crudas, sin divisa ni separadores, y pintarlas exigiría decidir aquí el
 * formato —justo lo que no se hace—. Cuando el formateado no viene, la pantalla deja un hueco.
 */
export interface OrderItem {
  readonly id: string
  readonly productId: string
  readonly variantId?: string
  readonly productTitle: string
  readonly variantName?: string
  readonly imageUrl?: string
  readonly quantity: number
  readonly unitPriceFormatted?: string
  readonly lineTotalFormatted?: string
}

/**
 * Detalle completo del pedido.
 *
 * IMPORTES: todos llegan ya formateados por el backend en la moneda mostrada. La aplicación no suma
 * el subtotal con el envío ni comprueba que cuadren con el total: el desglose que se pinta es
 * exactamente el que se facturó.
 */
export interface OrderDetail {
  readonly id: string
  readonly orderNumber: string
  readonly status: string
  readonly paymentMethod?: string
  readonly currency: string
  readonly subtotalFormatted?: string
  readonly shippingFormatted?: string
  /** El derecho de aduana, aparte del porte: al pagar se ven separados y aquí también. */
  readonly customsDutyFormatted?: string
  readonly taxFormatted?: string
  readonly totalFormatted?: string
  /** Descuento de referido del comprador. El total ya lo tiene restado. */
  readonly discountFormatted?: string
  readonly shippingAddress?: OrderAddress
  readonly notes?: string
  readonly trackingCarrier?: string
  readonly trackingNumber?: string
  readonly placedAt?: string
  readonly shippedAt?: string
  readonly deliveredAt?: string
  readonly cancelledAt?: string
  readonly items: readonly OrderItem[]
}
