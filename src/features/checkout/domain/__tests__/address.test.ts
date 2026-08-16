import {
  addressSummary,
  addressTitle,
  defaultAddress,
  isCompleteAddress,
  NewAddress,
} from '../entities/address'
import { anAddress } from '../testing/checkout-builders'

function aNewAddress(overrides: Partial<NewAddress> = {}): NewAddress {
  return { fullName: 'Ana Ruiz', line1: 'Calle Mayor 1', city: 'Madrid', country: 'ES', ...overrides }
}

describe('dirección', () => {
  it('acepta la dirección con destinatario, calle, ciudad y país', () => {
    expect(isCompleteAddress(aNewAddress())).toBe(true)
  })

  it('rechaza los campos que solo tienen espacios', () => {
    expect(isCompleteAddress(aNewAddress({ fullName: '   ' }))).toBe(false)
    expect(isCompleteAddress(aNewAddress({ line1: '' }))).toBe(false)
    expect(isCompleteAddress(aNewAddress({ city: ' ' }))).toBe(false)
  })

  it('exige el país en dos letras porque es lo que cotiza los portes', () => {
    expect(isCompleteAddress(aNewAddress({ country: 'España' }))).toBe(false)
    expect(isCompleteAddress(aNewAddress({ country: '' }))).toBe(false)
  })

  it('no obliga a teléfono, provincia ni código postal', () => {
    // Hay países sin código postal: exigirlo dejaría fuera destinos válidos.
    expect(isCompleteAddress(aNewAddress({ phone: undefined, postalCode: undefined }))).toBe(true)
  })

  it('propone la dirección predeterminada', () => {
    const casa = anAddress({ id: 'a-1', isDefault: false })
    const oficina = anAddress({ id: 'a-2', isDefault: true })

    expect(defaultAddress([casa, oficina])?.id).toBe('a-2')
  })

  it('propone la primera cuando ninguna es predeterminada', () => {
    const casa = anAddress({ id: 'a-1', isDefault: false })

    expect(defaultAddress([casa, anAddress({ id: 'a-2', isDefault: false })])?.id).toBe('a-1')
  })

  it('no propone nada cuando la libreta está vacía', () => {
    expect(defaultAddress([])).toBeUndefined()
  })

  it('resume la dirección omitiendo lo que falta', () => {
    const summary = addressSummary(
      anAddress({ line2: undefined, state: undefined, postalCode: '28013' }),
    )

    expect(summary).toBe('Calle Mayor 1, Madrid, 28013, ES')
  })

  it('titula con la etiqueta y, si no la hay, con el destinatario', () => {
    expect(addressTitle(anAddress({ label: 'Oficina' }))).toBe('Oficina')
    expect(addressTitle(anAddress({ label: undefined }))).toBe('Ana Ruiz')
    expect(addressTitle(anAddress({ label: '  ' }))).toBe('Ana Ruiz')
  })
})
