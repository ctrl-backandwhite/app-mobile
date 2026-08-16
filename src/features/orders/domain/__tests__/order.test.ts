import { isCancellable, statusLabel, statusTone } from '../entities/order'
import { anOrder, anOrderDetail } from '../testing/fake-orders-repository'

describe('isCancellable', () => {
  it('permite cancelar un pedido pagado y aún no enviado al proveedor', () => {
    expect(isCancellable(anOrder({ status: 'PAID' }))).toBe(true)
  })

  it.each(['PENDING', 'AWAITING_PAYMENT', 'FORWARDED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])(
    'no permite cancelar un pedido en estado %s',
    (status) => {
      // Desde FORWARDED la mercancía ya está comprada: lo que procede es una devolución, no una
      // cancelación, y el backend rechaza la llamada con ORDER_NOT_CANCELLABLE.
      expect(isCancellable(anOrder({ status }))).toBe(false)
    },
  )

  it('aplica la misma regla al detalle que a la fila del listado', () => {
    expect(isCancellable(anOrderDetail({ status: 'PAID' }))).toBe(true)
    expect(isCancellable(anOrderDetail({ status: 'SHIPPED' }))).toBe(false)
  })
})

describe('statusLabel', () => {
  it.each([
    ['PENDING', 'Pendiente'],
    ['AWAITING_PAYMENT', 'Esperando pago'],
    ['PAID', 'Pagado'],
    ['FORWARDED', 'Enviado a proveedor'],
    ['SHIPPED', 'En camino'],
    ['DELIVERED', 'Entregado'],
    ['CANCELLED', 'Cancelado'],
    ['REFUNDED', 'Reembolsado'],
  ])('traduce %s como «%s»', (status, label) => {
    expect(statusLabel(status)).toBe(label)
  })

  it('devuelve tal cual un estado que la aplicación aún no conoce', () => {
    // Una versión nueva del backend no debe dejar la lista muda.
    expect(statusLabel('PARTIALLY_SHIPPED')).toBe('PARTIALLY_SHIPPED')
  })
})

describe('statusTone', () => {
  it.each(['PENDING', 'AWAITING_PAYMENT', 'PAID', 'FORWARDED', 'SHIPPED'])(
    '%s sigue en curso',
    (status) => {
      expect(statusTone(status)).toBe('progress')
    },
  )

  it('entregado es el único final feliz', () => {
    expect(statusTone('DELIVERED')).toBe('done')
  })

  it.each(['CANCELLED', 'REFUNDED'])('%s se lee como pedido cerrado sin entrega', (status) => {
    expect(statusTone(status)).toBe('cancelled')
  })

  it('un estado desconocido se pinta como en curso', () => {
    expect(statusTone('PARTIALLY_SHIPPED')).toBe('progress')
  })
})
