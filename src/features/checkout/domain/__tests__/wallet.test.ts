import { hasEnoughBalance } from '../entities/wallet'
import { aWalletBalance } from '../testing/checkout-builders'

describe('saldo del monedero', () => {
  it('llega cuando el disponible cubre el coste', () => {
    expect(hasEnoughBalance(aWalletBalance({ availableUsdCents: 5000 }), 2580)).toBe(true)
  })

  it('llega justo cuando el disponible es exactamente el coste', () => {
    expect(hasEnoughBalance(aWalletBalance({ availableUsdCents: 2580 }), 2580)).toBe(true)
  })

  it('no llega cuando falta un céntimo', () => {
    expect(hasEnoughBalance(aWalletBalance({ availableUsdCents: 2579 }), 2580)).toBe(false)
  })

  it('no afirma que falte dinero cuando no se conoce el saldo o el coste', () => {
    // La palabra final la tiene el backend: bloquear por falta de datos sería peor.
    expect(hasEnoughBalance(undefined, 2580)).toBe(true)
    expect(hasEnoughBalance(aWalletBalance({ availableUsdCents: 0 }), undefined)).toBe(true)
    expect(hasEnoughBalance(aWalletBalance({ availableUsdCents: 0 }), null)).toBe(true)
    expect(hasEnoughBalance(aWalletBalance({ availableUsdCents: 0 }), 0)).toBe(true)
  })
})
