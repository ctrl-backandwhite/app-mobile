import {
  canPlaceOrder,
  missingRequirements,
  shippingCountry,
  shippingRegion,
} from '../entities/checkout-draft'
import { anAddress } from '../testing/checkout-builders'

describe('borrador de la compra', () => {
  it('no deja tramitar sin dirección', () => {
    const draft = { payment: { kind: 'WALLET' as const } }

    expect(canPlaceOrder(draft)).toBe(false)
    expect(missingRequirements(draft)).toEqual(['address'])
  })

  it('no deja tramitar sin método de pago', () => {
    const draft = { address: anAddress() }

    expect(canPlaceOrder(draft)).toBe(false)
    expect(missingRequirements(draft)).toEqual(['payment'])
  })

  it('enumera todo lo que falta cuando no hay nada elegido', () => {
    expect(missingRequirements({})).toEqual(['address', 'payment'])
  })

  it('deja tramitar con dirección y método de pago', () => {
    const draft = { address: anAddress(), payment: { kind: 'CARD' as const, savedMethodId: 'pm_1' } }

    expect(canPlaceOrder(draft)).toBe(true)
    expect(missingRequirements(draft)).toEqual([])
  })

  it('saca el destino de la dirección elegida', () => {
    const draft = { address: anAddress({ country: 'US', state: 'CA' }) }

    expect(shippingCountry(draft)).toBe('US')
    expect(shippingRegion(draft)).toBe('CA')
  })

  it('trata la región vacía como ausencia de región', () => {
    // Una cadena vacía viajaría al backend como región «» y estropearía el cálculo del impuesto.
    expect(shippingRegion({ address: anAddress({ state: '  ' }) })).toBeUndefined()
    expect(shippingCountry({})).toBeUndefined()
  })
})
