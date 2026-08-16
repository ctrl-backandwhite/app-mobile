/**
 * Dobles del dominio de pedidos, compartidos por las pruebas de esta feature.
 *
 * Viven fuera de `__tests__` porque el `testMatch` de jest-expo trata como suite cualquier fichero
 * bajo esa carpeta, y un módulo sin `it` rompe la ejecución.
 */
import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { Order } from '../entities/order'
import { OrderAddress, OrderDetail, OrderItem } from '../entities/order-detail'
import { OrderTracking, Shipment, TrackingEvent } from '../entities/tracking'
import { OrdersRepository } from '../ports/orders-repository'

export function anOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o-1',
    orderNumber: 'NX-2026-0001',
    status: 'PAID',
    totalFormatted: '129,90 €',
    currency: 'EUR',
    itemCount: 2,
    placedAt: '2026-08-01T10:00:00Z',
    paymentMethod: 'WALLET',
    ...overrides,
  }
}

export function anOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: 'li-1',
    productId: 'p-1',
    productTitle: 'Camisa de lino',
    quantity: 2,
    unitPriceFormatted: '64,95 €',
    lineTotalFormatted: '129,90 €',
    ...overrides,
  }
}

export function anAddress(overrides: Partial<OrderAddress> = {}): OrderAddress {
  return {
    fullName: 'Ana Ruiz',
    line1: 'Gran Vía 2',
    city: 'Madrid',
    postalCode: '28013',
    country: 'ES',
    ...overrides,
  }
}

export function anOrderDetail(overrides: Partial<OrderDetail> = {}): OrderDetail {
  return {
    id: 'o-1',
    orderNumber: 'NX-2026-0001',
    status: 'PAID',
    paymentMethod: 'WALLET',
    currency: 'EUR',
    subtotalFormatted: '119,90 €',
    shippingFormatted: '10,00 €',
    taxFormatted: '0,00 €',
    totalFormatted: '129,90 €',
    shippingAddress: anAddress(),
    placedAt: '2026-08-01T10:00:00Z',
    items: [anOrderItem()],
    ...overrides,
  }
}

export function aTrackingEvent(overrides: Partial<TrackingEvent> = {}): TrackingEvent {
  return {
    status: 'IN_TRANSIT',
    description: 'Salida del centro logístico',
    location: 'Shenzhen',
    occurredAt: '2026-08-02T08:00:00Z',
    ...overrides,
  }
}

export function aShipment(overrides: Partial<Shipment> = {}): Shipment {
  return {
    sequenceNo: 1,
    carrier: 'YunExpress',
    trackingNumber: 'YT123456789',
    status: 'SHIPPED',
    weightGrams: 1200,
    events: [aTrackingEvent()],
    ...overrides,
  }
}

export function aTracking(overrides: Partial<OrderTracking> = {}): OrderTracking {
  return {
    status: 'SHIPPED',
    carrier: 'YunExpress',
    trackingNumber: 'YT123456789',
    events: [aTrackingEvent()],
    shipments: [],
    ...overrides,
  }
}

interface Options {
  orders?: readonly Order[]
  detail?: OrderDetail
  tracking?: OrderTracking
  cancelled?: OrderDetail
  error?: AppError
}

/**
 * Repositorio en memoria. Registra los argumentos recibidos para poder afirmar que el caso de uso
 * los limpia y los reenvía tal cual, que es casi toda su responsabilidad.
 */
export class FakeOrdersRepository implements OrdersRepository {
  lastId: string | null = null
  lastLang: string | null = null
  lastRefundToWallet: boolean | null = null
  listCalls = 0

  constructor(private readonly options: Options = {}) {}

  async list(): Promise<Result<Order[], AppError>> {
    this.listCalls += 1
    if (this.options.error) return err(this.options.error)
    return ok([...(this.options.orders ?? [])])
  }

  async detail(id: string, lang: string): Promise<Result<OrderDetail, AppError>> {
    this.lastId = id
    this.lastLang = lang
    if (this.options.error) return err(this.options.error)
    return ok(this.options.detail ?? anOrderDetail())
  }

  async tracking(id: string): Promise<Result<OrderTracking, AppError>> {
    this.lastId = id
    if (this.options.error) return err(this.options.error)
    return ok(this.options.tracking ?? aTracking())
  }

  async cancel(id: string, lang: string, refundToWallet: boolean): Promise<Result<OrderDetail, AppError>> {
    this.lastId = id
    this.lastLang = lang
    this.lastRefundToWallet = refundToWallet
    if (this.options.error) return err(this.options.error)
    return ok(this.options.cancelled ?? anOrderDetail({ status: 'CANCELLED' }))
  }
}
