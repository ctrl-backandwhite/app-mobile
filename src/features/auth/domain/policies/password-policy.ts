export interface PasswordRequirement {
  readonly key: 'length' | 'upper' | 'lower' | 'digit' | 'symbol'
  readonly met: boolean
}

export interface PasswordCheck {
  readonly requirements: readonly PasswordRequirement[]
  readonly valid: boolean
}

/** Misma política que el escritorio: 8 caracteres, mayúscula, minúscula, dígito y símbolo. */
export function checkPassword(value: string): PasswordCheck {
  const requirements: PasswordRequirement[] = [
    { key: 'length', met: value.length >= 8 },
    { key: 'upper', met: /[A-Z]/.test(value) },
    { key: 'lower', met: /[a-z]/.test(value) },
    { key: 'digit', met: /\d/.test(value) },
    { key: 'symbol', met: /[^A-Za-z0-9]/.test(value) },
  ]
  return { requirements, valid: requirements.every((r) => r.met) }
}
