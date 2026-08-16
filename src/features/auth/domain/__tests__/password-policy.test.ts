import { checkPassword, PasswordRequirement } from '../policies/password-policy'

function metOf(value: string, key: PasswordRequirement['key']): boolean {
  return checkPassword(value).requirements.some(
    (requirement) => requirement.key === key && requirement.met,
  )
}

describe('checkPassword', () => {
  it('acepta una contraseña que cumple los cinco requisitos', () => {
    const check = checkPassword('Secreta1!')

    expect(check.valid).toBe(true)
    expect(check.requirements.every((requirement) => requirement.met)).toBe(true)
  })

  it('enumera siempre los cinco requisitos en el mismo orden', () => {
    const keys = checkPassword('').requirements.map((requirement) => requirement.key)

    expect(keys).toEqual(['length', 'upper', 'lower', 'digit', 'symbol'])
  })

  it('rechaza por longitud insuficiente', () => {
    expect(metOf('Abc1!', 'length')).toBe(false)
    expect(checkPassword('Abc1!').valid).toBe(false)
  })

  it('rechaza por falta de mayúscula', () => {
    expect(metOf('secreta1!', 'upper')).toBe(false)
    expect(checkPassword('secreta1!').valid).toBe(false)
  })

  it('rechaza por falta de minúscula', () => {
    expect(metOf('SECRETA1!', 'lower')).toBe(false)
    expect(checkPassword('SECRETA1!').valid).toBe(false)
  })

  it('rechaza por falta de dígito', () => {
    expect(metOf('Secretaa!', 'digit')).toBe(false)
    expect(checkPassword('Secretaa!').valid).toBe(false)
  })

  it('rechaza por falta de símbolo', () => {
    expect(metOf('Secreta11', 'symbol')).toBe(false)
    expect(checkPassword('Secreta11').valid).toBe(false)
  })
})
