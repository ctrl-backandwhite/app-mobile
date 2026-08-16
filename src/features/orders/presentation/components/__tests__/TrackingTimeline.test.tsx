import { render, screen } from '@testing-library/react-native'

import { aTrackingEvent } from '@features/orders/domain/testing/fake-orders-repository'

import { TrackingTimeline } from '../TrackingTimeline'

describe('TrackingTimeline', () => {
  it('pinta el paso más reciente arriba', async () => {
    await render(
      <TrackingTimeline
        events={[
          aTrackingEvent({ description: 'Admitido en origen', occurredAt: '2026-08-01T08:00:00Z' }),
          aTrackingEvent({ description: 'Entregado', occurredAt: '2026-08-05T08:00:00Z' }),
        ]}
      />,
    )

    const descriptions = screen.getAllByText(/Admitido en origen|Entregado/)
    expect(descriptions[0]).toHaveTextContent('Entregado')
    expect(descriptions[1]).toHaveTextContent('Admitido en origen')
  })

  it('acompaña cada paso de su fecha y su ubicación', async () => {
    await render(
      <TrackingTimeline
        events={[
          aTrackingEvent({
            description: 'Salida del centro logístico',
            location: 'Shenzhen',
            occurredAt: '2026-08-02T08:00:00Z',
          }),
        ]}
      />,
    )

    expect(screen.getByText(/Shenzhen/)).toBeTruthy()
    expect(screen.getByText(/ago/)).toBeTruthy()
  })

  it('cae al estado cuando el transportista no manda descripción', async () => {
    await render(<TrackingTimeline events={[aTrackingEvent({ description: undefined })]} />)

    expect(screen.getByText('IN_TRANSIT')).toBeTruthy()
  })

  it('un paso sin fecha se pinta con un hueco en lugar de una fecha inválida', async () => {
    await render(
      <TrackingTimeline
        events={[aTrackingEvent({ description: 'Registrado', occurredAt: undefined, location: undefined })]}
      />,
    )

    expect(screen.getByText('—')).toBeTruthy()
  })

  it('avisa cuando todavía no hay movimientos', async () => {
    await render(<TrackingTimeline events={[]} />)

    expect(screen.getByText('Todavía no hay movimientos registrados.')).toBeTruthy()
  })
})
