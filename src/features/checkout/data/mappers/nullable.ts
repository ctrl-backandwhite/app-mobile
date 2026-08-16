/**
 * «No hay dato» llega de tres formas del backend: campo ausente, `null` o cadena vacía. La cadena
 * vacía es la más traicionera: pintaría un hueco en blanco donde debería no haber línea, y en un
 * resumen de compra un hueco en blanco se lee como «cero».
 */
export function text(value?: string | null): string | undefined {
  if (value === undefined || value === null) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/** Igual para los números opcionales, que el backend manda como `null` cuando no aplican. */
export function num(value?: number | null): number | undefined {
  return value === undefined || value === null ? undefined : value
}
