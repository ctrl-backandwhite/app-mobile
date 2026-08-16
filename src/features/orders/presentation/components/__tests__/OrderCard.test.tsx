import { fireEvent, render, screen } from '@testing-library/react-native'

import { anOrder } from '@features/orders/domain/testing/fake-orders-repository'

import { OrderCard } from '../OrderCard'

describe('OrderCard', () => {
  it('pinta número, estado traducido, artículos e importe del backend', async () => {
    await render(<OrderCard order={anOrder()} onPress={jest.fn()} />)

    expect(screen.getByText('NX-2026-0001')).toBeTruthy()
    expect(screen.getByText('Pagado')).toBeTruthy()
    expect(screen.getByText('2 artículos')).toBeTruthy()
    expect(screen.getByText('129,90 €')).toBeTruthy()
  })

  it('deja un hueco cuando el backend no manda el importe', async () => {
    // Nunca se compone un total a partir de las líneas: contradiría a la factura.
    await render(<OrderCard order={anOrder({ totalFormatted: undefined })} onPress={jest.fn()} />)

    expect(screen.getByTestId('order-total-o-1')).toHaveTextContent('—')
  })

  it('concuerda el singular cuando el pedido lleva un solo artículo', async () => {
    await render(<OrderCard order={anOrder({ itemCount: 1 })} onPress={jest.fn()} />)

    expect(screen.getByText('1 artículo')).toBeTruthy()
  })

  it('abre el pedido al pulsarlo', async () => {
    const onPress = jest.fn()
    const order = anOrder()
    await render(<OrderCard order={order} onPress={onPress} />)

    await fireEvent.press(screen.getByLabelText('Pedido NX-2026-0001, Pagado'))

    expect(onPress).toHaveBeenCalledWith(order)
  })

  it('nombra el estado en la etiqueta accesible, que es lo que se lee sin ver el color', async () => {
    await render(<OrderCard order={anOrder({ status: 'DELIVERED' })} onPress={jest.fn()} />)

    expect(screen.getByLabelText('Pedido NX-2026-0001, Entregado')).toBeTruthy()
  })

  it('un estado desconocido se pinta tal cual en lugar de dejar el hueco mudo', async () => {
    await render(<OrderCard order={anOrder({ status: 'PARTIALLY_SHIPPED' })} onPress={jest.fn()} />)

    expect(screen.getByText('PARTIALLY_SHIPPED')).toBeTruthy()
  })
})
