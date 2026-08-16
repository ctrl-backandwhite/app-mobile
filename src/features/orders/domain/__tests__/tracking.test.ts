import { sortEventsByDate } from '../entities/tracking'
import { aTrackingEvent } from '../testing/fake-orders-repository'

describe('sortEventsByDate', () => {
  it('deja el paso más reciente arriba', () => {
    const events = [
      aTrackingEvent({ status: 'ACCEPTED', occurredAt: '2026-08-01T08:00:00Z' }),
      aTrackingEvent({ status: 'DELIVERED', occurredAt: '2026-08-05T08:00:00Z' }),
      aTrackingEvent({ status: 'IN_TRANSIT', occurredAt: '2026-08-03T08:00:00Z' }),
    ]

    expect(sortEventsByDate(events).map((event) => event.status)).toEqual([
      'DELIVERED',
      'IN_TRANSIT',
      'ACCEPTED',
    ])
  })

  it('no toca la lista original', () => {
    // La lista llega de la caché de consultas: ordenarla en el sitio cambiaría también lo cacheado.
    const events = [
      aTrackingEvent({ status: 'ACCEPTED', occurredAt: '2026-08-01T08:00:00Z' }),
      aTrackingEvent({ status: 'DELIVERED', occurredAt: '2026-08-05T08:00:00Z' }),
    ]

    sortEventsByDate(events)

    expect(events.map((event) => event.status)).toEqual(['ACCEPTED', 'DELIVERED'])
  })

  it('manda al final los pasos sin fecha', () => {
    const events = [
      aTrackingEvent({ status: 'SIN_FECHA', occurredAt: undefined }),
      aTrackingEvent({ status: 'ACCEPTED', occurredAt: '2026-08-01T08:00:00Z' }),
    ]

    expect(sortEventsByDate(events).map((event) => event.status)).toEqual(['ACCEPTED', 'SIN_FECHA'])
  })

  it('trata una fecha ilegible como ausente en lugar de dejar el orden al azar', () => {
    const events = [
      aTrackingEvent({ status: 'ROTA', occurredAt: 'no es una fecha' }),
      aTrackingEvent({ status: 'ACCEPTED', occurredAt: '2026-08-01T08:00:00Z' }),
    ]

    expect(sortEventsByDate(events).map((event) => event.status)).toEqual(['ACCEPTED', 'ROTA'])
  })

  it('conserva el orden de llegada entre pasos igual de indatables', () => {
    const events = [
      aTrackingEvent({ status: 'PRIMERO', occurredAt: undefined }),
      aTrackingEvent({ status: 'SEGUNDO', occurredAt: undefined }),
    ]

    expect(sortEventsByDate(events).map((event) => event.status)).toEqual(['PRIMERO', 'SEGUNDO'])
  })

  it('una lista vacía sigue vacía', () => {
    expect(sortEventsByDate([])).toEqual([])
  })
})
