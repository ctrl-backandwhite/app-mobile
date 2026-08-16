import { fireEvent, screen, waitFor } from '@testing-library/react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import { anOrder } from '@features/orders/domain/testing/fake-orders-repository'

import { OrdersScreen } from '../screens/OrdersScreen'
import { renderOrders } from '../testing/render-orders'

function listThatReturns(result: unknown) {
  return { execute: jest.fn().mockResolvedValue(result) }
}

describe('OrdersScreen', () => {
  it('pinta los pedidos del histórico con su estado y su importe', async () => {
    const listOrders = listThatReturns(
      ok([
        anOrder({ id: 'o-1', orderNumber: 'NX-1', status: 'SHIPPED', totalFormatted: '129,90 €' }),
        anOrder({ id: 'o-2', orderNumber: 'NX-2', status: 'DELIVERED', totalFormatted: '15,00 €' }),
      ]),
    )
    await renderOrders(<OrdersScreen />, { listOrders: listOrders as never })

    expect(await screen.findByText('NX-1')).toBeTruthy()
    expect(screen.getByText('NX-2')).toBeTruthy()
    expect(screen.getByText('En camino')).toBeTruthy()
    expect(screen.getByText('Entregado')).toBeTruthy()
    expect(screen.getByText('129,90 €')).toBeTruthy()
  })

  it('avisa con su propio hueco cuando no hay ningún pedido', async () => {
    await renderOrders(<OrdersScreen />, { listOrders: listThatReturns(ok([])) as never })

    expect(await screen.findByText('Todavía no has hecho ningún pedido')).toBeTruthy()
  })

  it('desde el hueco se sale al catálogo', async () => {
    await renderOrders(<OrdersScreen />, { listOrders: listThatReturns(ok([])) as never })

    await fireEvent.press(await screen.findByText('Ver el catálogo'))

    expect(global.routerMock.push).toHaveBeenCalledWith('/(app)/(tabs)/catalog')
  })

  it('abre el detalle al pulsar un pedido', async () => {
    const listOrders = listThatReturns(ok([anOrder({ id: 'o-7', orderNumber: 'NX-7' })]))
    await renderOrders(<OrdersScreen />, { listOrders: listOrders as never })

    await fireEvent.press(await screen.findByTestId('order-card-o-7'))

    expect(global.routerMock.push).toHaveBeenCalledWith('/orders/o-7')
  })

  it('ofrece reintentar cuando el histórico falla', async () => {
    const listOrders = {
      execute: jest
        .fn()
        .mockResolvedValueOnce(err(new AppError('NETWORK', 'Sin conexión')))
        .mockResolvedValue(ok([anOrder({ orderNumber: 'NX-9' })])),
    }
    await renderOrders(<OrdersScreen />, { listOrders: listOrders as never })

    expect(await screen.findByText('No se ha podido cargar tu histórico')).toBeTruthy()
    await fireEvent.press(screen.getByText('Reintentar'))

    await waitFor(() => expect(screen.getByText('NX-9')).toBeTruthy())
  })
})
