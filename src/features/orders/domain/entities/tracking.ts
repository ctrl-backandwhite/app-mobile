/** Un paso del seguimiento tal y como lo comunicó el transportista. */
export interface TrackingEvent {
  readonly status: string
  readonly description?: string
  readonly location?: string
  readonly source?: string
  readonly occurredAt?: string
}

/**
 * Un bulto del pedido con su propia trazabilidad.
 *
 * Un pedido grande no cabe en un solo paquete: se reparte según los límites del transportista y cada
 * guía avanza a su ritmo. Por eso cada bulto lleva sus propios eventos y no se mezclan en una lista
 * única, donde sería imposible saber qué le pasa a cada uno.
 */
export interface Shipment {
  readonly sequenceNo: number
  readonly carrier?: string
  readonly trackingNumber?: string
  readonly status?: string
  readonly weightGrams: number
  readonly estimatedDeliveryAt?: string
  readonly events: readonly TrackingEvent[]
}

/** Seguimiento del pedido entero. `shipments` va vacío cuando todo viaja en un solo paquete. */
export interface OrderTracking {
  readonly status?: string
  readonly carrier?: string
  readonly trackingNumber?: string
  readonly estimatedDeliveryAt?: string
  readonly lastTrackedAt?: string
  readonly events: readonly TrackingEvent[]
  readonly shipments: readonly Shipment[]
}

/** Fecha comparable del evento. Sin fecha no se puede ordenar y el paso se manda al final. */
function timeOf(event: TrackingEvent): number {
  if (!event.occurredAt) return Number.NEGATIVE_INFINITY
  const time = new Date(event.occurredAt).getTime()
  // Una fecha ilegible se trata como ausente: la comparación con NaN devuelve siempre `false` y
  // dejaría el orden a merced del algoritmo de `sort`.
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time
}

/**
 * Los pasos del seguimiento, el más reciente primero.
 *
 * Devuelve una copia: `sort` ordena en el sitio y mutar la lista que llega del backend cambiaría
 * también la copia que guarda la caché de consultas.
 */
export function sortEventsByDate(events: readonly TrackingEvent[]): TrackingEvent[] {
  return [...events].sort((a, b) => {
    const left = timeOf(a)
    const right = timeOf(b)
    // Dos pasos sin fecha darían `-Infinity - -Infinity`, que es NaN: un comparador que devuelve
    // NaN deja el orden en manos del motor. Igualarlos explícitamente conserva el de llegada.
    return left === right ? 0 : right - left
  })
}
