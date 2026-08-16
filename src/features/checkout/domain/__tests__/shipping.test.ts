import {
  blocksOrder,
  etaLabel,
  hasCustomsLine,
  hasDiscountLine,
  taxRateLabel,
} from '../entities/shipping'
import { aShippingQuote } from '../testing/checkout-builders'

describe('cotización de portes', () => {
  it('no frena la compra mientras la cotización no ha llegado', () => {
    // Bloquear por falta de datos dejaría la compra muerta cada vez que la red va lenta.
    expect(blocksOrder(undefined)).toBe(false)
    expect(blocksOrder(null)).toBe(false)
  })

  it('frena la compra hacia un país sin cobertura', () => {
    expect(blocksOrder(aShippingQuote({ supported: false }))).toBe(true)
  })

  it('frena la compra que supera el límite de importación del destino', () => {
    expect(blocksOrder(aShippingQuote({ customsBlocked: true }))).toBe(true)
  })

  it('deja pasar la cotización normal', () => {
    expect(blocksOrder(aShippingQuote())).toBe(false)
  })

  it('escribe la tasa del impuesto como porcentaje', () => {
    expect(taxRateLabel(aShippingQuote({ taxRateBps: 2100 }))).toBe('21 %')
    expect(taxRateLabel(aShippingQuote({ taxRateBps: 2150 }))).toBe('21.5 %')
  })

  it('no escribe tasa cuando no hay impuesto ni cotización', () => {
    expect(taxRateLabel(aShippingQuote({ taxRateBps: 0 }))).toBeUndefined()
    expect(taxRateLabel(aShippingQuote({ supported: false, taxRateBps: 2100 }))).toBeUndefined()
    expect(taxRateLabel(undefined)).toBeUndefined()
  })

  it('escribe el plazo estimado', () => {
    expect(etaLabel(aShippingQuote({ etaMinDays: 7, etaMaxDays: 15 }))).toBe('7–15 días')
    expect(etaLabel(aShippingQuote({ etaMinDays: 10, etaMaxDays: 10 }))).toBe('10 días')
    expect(etaLabel(aShippingQuote({ etaMaxDays: 0 }))).toBeUndefined()
    expect(etaLabel(undefined)).toBeUndefined()
  })

  it('solo enseña la línea de aduana cuando hay recargo', () => {
    expect(hasCustomsLine(aShippingQuote({ customsHandlingUsdCents: 300 }))).toBe(true)
    expect(hasCustomsLine(aShippingQuote({ customsHandlingUsdCents: 0 }))).toBe(false)
    expect(hasCustomsLine(undefined)).toBe(false)
    expect(hasCustomsLine(null)).toBe(false)
  })

  it('solo enseña la línea de descuento cuando hay descuento', () => {
    expect(hasDiscountLine(aShippingQuote({ discountCents: 120 }))).toBe(true)
    expect(hasDiscountLine(aShippingQuote({ discountCents: 0 }))).toBe(false)
    expect(hasDiscountLine(aShippingQuote({ supported: false, discountCents: 120 }))).toBe(false)
    expect(hasDiscountLine(undefined)).toBe(false)
  })
})
