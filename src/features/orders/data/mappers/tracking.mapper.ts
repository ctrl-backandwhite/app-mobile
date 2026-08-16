import { OrderTracking, Shipment, TrackingEvent } from '@features/orders/domain/entities/tracking'

import { ShipmentDto, TrackingDto, TrackingEventDto } from '../dto/orders.dto'

function optional(value: string | null | undefined): string | undefined {
  return value ?? undefined
}

export function toTrackingEvent(dto: TrackingEventDto): TrackingEvent {
  return {
    status: dto.status,
    description: optional(dto.description),
    location: optional(dto.location),
    source: optional(dto.source),
    occurredAt: optional(dto.occurredAt),
  }
}

export function toShipment(dto: ShipmentDto): Shipment {
  return {
    sequenceNo: dto.sequenceNo,
    carrier: optional(dto.carrier),
    trackingNumber: optional(dto.trackingNumber),
    status: optional(dto.status),
    weightGrams: dto.weightGrams,
    estimatedDeliveryAt: optional(dto.estimatedDeliveryAt),
    events: dto.events.map(toTrackingEvent),
  }
}

/**
 * Los eventos NO se ordenan aquí: el orden es una decisión del dominio (`sortEventsByDate`) y
 * repetirla en la frontera dejaría dos sitios que mantener cuando cambie.
 */
export function toOrderTracking(dto: TrackingDto): OrderTracking {
  return {
    status: optional(dto.status),
    carrier: optional(dto.carrier),
    trackingNumber: optional(dto.trackingNumber),
    estimatedDeliveryAt: optional(dto.estimatedDeliveryAt),
    lastTrackedAt: optional(dto.lastTrackedAt),
    events: dto.events.map(toTrackingEvent),
    shipments: dto.shipments.map(toShipment),
  }
}
