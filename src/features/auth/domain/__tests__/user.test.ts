import { greetingNameOf, isStaff } from '../entities/user'
import { aUser } from '../testing/fake-auth-repository'

describe('isStaff', () => {
  it('reconoce al personal interno', () => {
    expect(isStaff(aUser({ role: 'ADMIN' }))).toBe(true)
    expect(isStaff(aUser({ role: 'OPERATOR' }))).toBe(true)
  })

  it('deja fuera a la clientela y a los socios', () => {
    expect(isStaff(aUser({ role: 'USER' }))).toBe(false)
    expect(isStaff(aUser({ role: 'PARTNER' }))).toBe(false)
  })
})

describe('greetingNameOf', () => {
  it('prefiere el nombre público', () => {
    expect(greetingNameOf(aUser({ displayName: 'Ana' }))).toBe('Ana')
  })

  it('degrada al nombre de pila', () => {
    expect(greetingNameOf(aUser({ displayName: undefined, firstName: 'Ana María' }))).toBe(
      'Ana María',
    )
  })

  it('degrada al nombre completo', () => {
    expect(
      greetingNameOf(aUser({ displayName: undefined, firstName: undefined, fullName: 'Ana Ruiz' })),
    ).toBe('Ana Ruiz')
  })

  it('acaba en el correo cuando no hay ningún nombre', () => {
    expect(greetingNameOf(aUser({ displayName: '' }))).toBe('ana@nx036.com')
  })
})
