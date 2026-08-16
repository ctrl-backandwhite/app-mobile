import {
  defaultPaymentMethod,
  expiryLabel,
  kindLabel,
  paymentLabel,
  savedCardId,
  selectionFor,
} from '../entities/payment-method'
import { aPaymentMethod } from '../testing/checkout-builders'

describe('métodos de pago', () => {
  it('nombra la tarjeta con su marca y sus cuatro últimos dígitos', () => {
    expect(paymentLabel(aPaymentMethod({ brand: 'visa', last4: '4242' }))).toBe('VISA •••• 4242')
  })

  it('nombra la tarjeta sin inventar lo que el backend no manda', () => {
    expect(paymentLabel(aPaymentMethod({ brand: undefined, last4: undefined }))).toBe('Tarjeta')
    expect(paymentLabel(aPaymentMethod({ brand: undefined, last4: '9999' }))).toBe('Tarjeta •••• 9999')
  })

  it('nombra PayPal con el correo enmascarado que envía el backend', () => {
    const paypal = aPaymentMethod({ id: 'paypal:1', type: 'PAYPAL', paypalEmail: 'j***@dominio.com' })

    expect(paymentLabel(paypal)).toBe('PayPal · j***@dominio.com')
    expect(paymentLabel({ ...paypal, paypalEmail: undefined })).toBe('PayPal')
  })

  it('escribe la caducidad con dos dígitos de mes y de año', () => {
    expect(expiryLabel(aPaymentMethod({ expMonth: 4, expYear: 2027 }))).toBe('04/27')
  })

  it('no escribe caducidad si no es una tarjeta o el backend no la manda', () => {
    expect(expiryLabel(aPaymentMethod({ expMonth: undefined, expYear: 2027 }))).toBeUndefined()
    expect(expiryLabel(aPaymentMethod({ type: 'PAYPAL', expMonth: 4, expYear: 2027 }))).toBeUndefined()
  })

  it('elige el método marcado por defecto y, si no lo hay, el primero', () => {
    const primero = aPaymentMethod({ id: 'pm_1', isDefault: false })
    const marcado = aPaymentMethod({ id: 'pm_2', isDefault: true })

    expect(defaultPaymentMethod([primero, marcado])?.id).toBe('pm_2')
    expect(defaultPaymentMethod([primero])?.id).toBe('pm_1')
    expect(defaultPaymentMethod([])).toBeUndefined()
  })

  it('traduce el método guardado a la elección que entiende la tramitación', () => {
    expect(selectionFor(aPaymentMethod({ id: 'pm_9' }))).toEqual({ kind: 'CARD', savedMethodId: 'pm_9' })
    expect(selectionFor(aPaymentMethod({ id: 'paypal:9', type: 'PAYPAL' }))).toEqual({
      kind: 'PAYPAL',
      savedMethodId: 'paypal:9',
    })
  })

  it('solo hay tarjeta que cobrar tras el pedido cuando se paga con una guardada', () => {
    expect(savedCardId({ kind: 'CARD', savedMethodId: 'pm_1' })).toBe('pm_1')
    expect(savedCardId({ kind: 'CARD' })).toBeUndefined()
    expect(savedCardId({ kind: 'PAYPAL', savedMethodId: 'paypal:1' })).toBeUndefined()
    expect(savedCardId({ kind: 'WALLET' })).toBeUndefined()
    expect(savedCardId()).toBeUndefined()
  })

  it('nombra las formas de pago genéricas', () => {
    expect(kindLabel('WALLET')).toBe('Monedero')
    expect(kindLabel('CARD')).toBe('Tarjeta')
    expect(kindLabel('PAYPAL')).toBe('PayPal')
  })
})
