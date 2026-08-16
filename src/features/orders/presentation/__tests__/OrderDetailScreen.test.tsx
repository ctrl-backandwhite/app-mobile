import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import { Alert, AlertButton } from 'react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import {
  anAddress,
  anOrderDetail,
  anOrderItem,
  aShipment,
  aTracking,
  aTrackingEvent,
} from '@features/orders/domain/testing/fake-orders-repository'

import { OrderDetailScreen } from '../screens/OrderDetailScreen'
import { renderOrders } from '../testing/render-orders'

function resolving(result: unknown) {
  return { execute: jest.fn().mockResolvedValue(result) }
}

function deps(overrides: Record<string, unknown> = {}) {
  return {
    getOrderDetail: resolving(ok(anOrderDetail())),
    getOrderTracking: resolving(ok(aTracking({ events: [] }))),
    cancelOrder: resolving(ok(anOrderDetail({ status: 'CANCELLED' }))),
    ...overrides,
  }
}

/**
 * Pulsa el botón de la confirmación que realmente cancela; el otro solo cierra el diálogo.
 *
 * Va envuelto en `act` porque la cancelación cambia el estado de la pantalla fuera de un evento de
 * la interfaz: sin él React avisa de que la actualización queda sin envolver.
 */
async function confirmCancellation(alertSpy: jest.SpyInstance): Promise<void> {
  const buttons = alertSpy.mock.calls[0]?.[2] as AlertButton[]
  const confirm = buttons.find((button) => button.style === 'destructive')
  if (!confirm) throw new Error('La confirmación no ofrece ningún botón de cancelar')
  await act(async () => {
    confirm.onPress?.()
    await Promise.resolve()
  })
}

describe('OrderDetailScreen', () => {
  beforeEach(() => {
    global.setLocalSearchParams({ id: 'o-1' })
  })

  it('pinta las líneas, la dirección y el desglose que manda el backend', async () => {
    const detail = anOrderDetail({
      items: [anOrderItem({ productTitle: 'Camisa de lino', variantName: 'Azul / M' })],
    })
    await renderOrders(<OrderDetailScreen />, deps({ getOrderDetail: resolving(ok(detail)) }) as never)

    expect(await screen.findByText('Camisa de lino')).toBeTruthy()
    expect(screen.getByText('Azul / M')).toBeTruthy()
    expect(screen.getByText('Ana Ruiz')).toBeTruthy()
    expect(screen.getByText('Gran Vía 2')).toBeTruthy()
    expect(screen.getByText('28013 Madrid')).toBeTruthy()
    expect(screen.getByText('119,90 €')).toBeTruthy()
    expect(screen.getByText('10,00 €')).toBeTruthy()
    // El total sale dos veces: en la línea del artículo y en el resumen. Ninguno se calcula aquí.
    expect(screen.getAllByText('129,90 €')).toHaveLength(2)
  })

  it('deja un hueco en el importe que el backend no manda, en la línea y en el resumen', async () => {
    // Ni el total del pedido ni el de la línea se componen aquí: contradirían a la factura emitida.
    const detail = anOrderDetail({
      subtotalFormatted: undefined,
      totalFormatted: undefined,
      items: [anOrderItem({ lineTotalFormatted: undefined })],
    })
    await renderOrders(<OrderDetailScreen />, deps({ getOrderDetail: resolving(ok(detail)) }) as never)

    await screen.findByText('Resumen')
    expect(screen.getAllByText('—')).toHaveLength(3)
  })

  it('pinta el seguimiento con el paso más reciente arriba', async () => {
    const tracking = aTracking({
      events: [
        aTrackingEvent({ description: 'Admitido en origen', occurredAt: '2026-08-01T08:00:00Z' }),
        aTrackingEvent({ description: 'En reparto', occurredAt: '2026-08-06T08:00:00Z' }),
      ],
    })
    await renderOrders(
      <OrderDetailScreen />,
      deps({ getOrderTracking: resolving(ok(tracking)) }) as never,
    )

    expect(await screen.findByText('Seguimiento')).toBeTruthy()
    const steps = screen.getAllByText(/Admitido en origen|En reparto/)
    expect(steps[0]).toHaveTextContent('En reparto')
  })

  it('separa los bultos cuando el pedido viaja en varios paquetes', async () => {
    // Cada guía avanza a su ritmo: mezclarlas haría imposible saber qué le pasa a cada bulto.
    const tracking = aTracking({
      events: [],
      shipments: [
        aShipment({ sequenceNo: 1, trackingNumber: 'YT-1' }),
        // Sin transportista: la guía se pinta igual, que es el dato con el que se reclama.
        aShipment({ sequenceNo: 2, trackingNumber: 'YT-2', carrier: undefined, events: [] }),
      ],
    })
    await renderOrders(
      <OrderDetailScreen />,
      deps({ getOrderTracking: resolving(ok(tracking)) }) as never,
    )

    expect(await screen.findByTestId('shipment-1')).toBeTruthy()
    expect(screen.getByTestId('shipment-2')).toBeTruthy()
    expect(screen.getByText('Bulto 1 de 2 · 1.20 kg')).toBeTruthy()
    expect(screen.getByText(/YT-2/)).toBeTruthy()
  })

  it('no enseña el bloque de seguimiento cuando aún no hay nada que seguir', async () => {
    await renderOrders(<OrderDetailScreen />, deps() as never)

    await screen.findByText('Resumen')
    expect(screen.queryByText('Seguimiento')).toBeNull()
  })

  it('sigue pintando el pedido aunque falle el seguimiento', async () => {
    await renderOrders(
      <OrderDetailScreen />,
      deps({ getOrderTracking: resolving(err(new AppError('SERVER', 'Se ha roto'))) }) as never,
    )

    expect(await screen.findByText('Camisa de lino')).toBeTruthy()
  })

  it('ofrece cancelar solo cuando el pedido está pagado y sin enviar', async () => {
    await renderOrders(<OrderDetailScreen />, deps() as never)

    expect(await screen.findByText('Cancelar pedido')).toBeTruthy()
  })

  it.each(['PENDING', 'FORWARDED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])(
    'no ofrece cancelar un pedido en estado %s',
    async (status) => {
      await renderOrders(
        <OrderDetailScreen />,
        deps({ getOrderDetail: resolving(ok(anOrderDetail({ status }))) }) as never,
      )

      await screen.findByText('Resumen')
      expect(screen.queryByText('Cancelar pedido')).toBeNull()
    },
  )

  it('pide confirmación antes de cancelar y no llama al caso de uso hasta tenerla', async () => {
    // Cancelar devuelve dinero y no se deshace: no puede dispararse por un roce en la pantalla.
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
    const container = deps()
    await renderOrders(<OrderDetailScreen />, container as never)

    await fireEvent.press(await screen.findByText('Cancelar pedido'))

    expect(alertSpy).toHaveBeenCalledTimes(1)
    expect(container.cancelOrder.execute).not.toHaveBeenCalled()
    alertSpy.mockRestore()
  })

  it('cancela el pedido al confirmar', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
    const container = deps()
    await renderOrders(<OrderDetailScreen />, container as never)

    await fireEvent.press(await screen.findByText('Cancelar pedido'))
    await confirmCancellation(alertSpy)

    await waitFor(() => expect(container.cancelOrder.execute).toHaveBeenCalledWith('o-1', 'es'))
    alertSpy.mockRestore()
  })

  it('enseña el motivo cuando el backend rechaza la cancelación', async () => {
    // Entre pintar el botón y confirmarlo el pedido pudo avanzar: manda el servidor.
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
    const container = deps({
      cancelOrder: resolving(err(new AppError('CONFLICT', 'El pedido ya no se puede cancelar'))),
    })
    await renderOrders(<OrderDetailScreen />, container as never)

    await fireEvent.press(await screen.findByText('Cancelar pedido'))
    await confirmCancellation(alertSpy)

    expect(await screen.findByText('El pedido ya no se puede cancelar')).toBeTruthy()
    alertSpy.mockRestore()
  })

  it('pinta la guía, la foto, el descuento y la dirección completa cuando llegan', async () => {
    const detail = anOrderDetail({
      trackingCarrier: 'YunExpress',
      trackingNumber: 'YT123456789',
      discountFormatted: '5,00 €',
      shippingAddress: anAddress({ state: 'Madrid', phone: '+34600000000', line2: 'Puerta 3' }),
      items: [anOrderItem({ imageUrl: 'https://cdn.nx036.com/p-1.jpg' })],
    })
    await renderOrders(<OrderDetailScreen />, deps({ getOrderDetail: resolving(ok(detail)) }) as never)

    expect(await screen.findByText('YunExpress · YT123456789')).toBeTruthy()
    expect(screen.getByText('Descuento')).toBeTruthy()
    expect(screen.getByText('5,00 €')).toBeTruthy()
    expect(screen.getByText('Puerta 3')).toBeTruthy()
    expect(screen.getByText('Madrid, ES')).toBeTruthy()
    expect(screen.getByText('+34600000000')).toBeTruthy()
  })

  it('no enseña el bloque de dirección cuando el pedido no la lleva', async () => {
    const detail = anOrderDetail({ shippingAddress: undefined, trackingNumber: 'YT-9' })
    await renderOrders(<OrderDetailScreen />, deps({ getOrderDetail: resolving(ok(detail)) }) as never)

    await screen.findByText('Resumen')
    expect(screen.queryByText('Dirección de envío')).toBeNull()
    // La guía sin transportista se pinta sola: es el dato con el que se reclama el envío.
    expect(screen.getByText('YT-9')).toBeTruthy()
  })

  it('el bulto sin peso ni guía se pinta igual, solo con su número', async () => {
    const tracking = aTracking({
      events: [],
      shipments: [
        aShipment({ sequenceNo: 1, weightGrams: 0, trackingNumber: undefined, carrier: undefined }),
      ],
    })
    await renderOrders(
      <OrderDetailScreen />,
      deps({ getOrderTracking: resolving(ok(tracking)) }) as never,
    )

    expect(await screen.findByText('Bulto 1 de 1')).toBeTruthy()
  })

  it('ofrece volver cuando el pedido no se puede cargar', async () => {
    await renderOrders(
      <OrderDetailScreen />,
      deps({ getOrderDetail: resolving(err(new AppError('NOT_FOUND', 'No existe'))) }) as never,
    )

    await fireEvent.press(await screen.findByText('Volver'))

    expect(global.routerMock.back).toHaveBeenCalled()
  })
})
