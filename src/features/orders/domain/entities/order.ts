/**
 * Pedido tal y como lo necesita el histórico.
 *
 * IMPORTES: igual que en el catálogo, el cálculo y el formateo son responsabilidad EXCLUSIVA del
 * backend, que devuelve el total ya listo para pintar en `totalFormatted`. Por eso no hay ningún
 * campo numérico de dinero: la aplicación no convierte, no suma y no da formato. Un importe
 * recalculado aquí dejaría de coincidir con el que se cobró en cuanto cambiara una tasa de cambio,
 * y el histórico contradiría a la factura.
 */
export interface Order {
  readonly id: string
  readonly orderNumber: string
  /** Estado tal y como lo manda el backend (PAID, SHIPPED…). Se traduce al pintarlo. */
  readonly status: string
  /** Total ya formateado por el backend en la moneda activa. Falta si el backend no lo manda. */
  readonly totalFormatted?: string
  readonly currency: string
  readonly itemCount: number
  readonly placedAt: string
  readonly shippedAt?: string
  readonly deliveredAt?: string
  /** CARD, PAYPAL, USDT o WALLET. Decide a dónde se ofrece el reembolso al cancelar. */
  readonly paymentMethod?: string
}

/**
 * Estado en el que el pedido está pagado pero todavía no se ha enviado al proveedor.
 *
 * Es el ÚNICO en el que el backend acepta la cancelación (`OrderUseCaseImpl.cancelMyOrder`): en
 * cuanto pasa a FORWARDED la mercancía ya está comprada y lo que procede es una devolución, que se
 * gestiona a mano. Ofrecer el botón fuera de aquí solo produciría un error del servidor.
 */
const CANCELLABLE_STATUS = 'PAID'

/** Estados en los que el pedido ya no avanza. */
const CLOSED_STATUSES = ['CANCELLED', 'REFUNDED']

/** Traducciones de los estados del backend. El histórico se lee en español. */
const STATUS_LABELS: Readonly<Record<string, string>> = {
  PENDING: 'Pendiente',
  AWAITING_PAYMENT: 'Esperando pago',
  PAID: 'Pagado',
  FORWARDED: 'Enviado a proveedor',
  SHIPPED: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

/** Cómo se lee el estado de un vistazo: avanzando, terminado bien o terminado mal. */
export type OrderTone = 'progress' | 'done' | 'cancelled'

/**
 * Si el cliente puede cancelar el pedido él mismo.
 *
 * Se acepta cualquier cosa que tenga estado —el resumen de la lista y el detalle— porque la regla es
 * la misma en las dos pantallas y duplicarla dejaría un botón que sale en una y no en la otra.
 */
export function isCancellable(order: Pick<Order, 'status'>): boolean {
  return order.status === CANCELLABLE_STATUS
}

/**
 * Etiqueta en español del estado.
 *
 * Un estado que la aplicación instalada aún no conoce se devuelve tal cual: es más útil leer
 * «PARTIALLY_SHIPPED» que un hueco vacío, y así una versión nueva del backend no deja la lista muda.
 */
export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

/** Clasificación del estado para darle color. `DELIVERED` es el único final feliz. */
export function statusTone(status: string): OrderTone {
  if (CLOSED_STATUSES.includes(status)) return 'cancelled'
  return status === 'DELIVERED' ? 'done' : 'progress'
}
