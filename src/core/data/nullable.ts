/**
 * «No hay dato» llega de tres formas del backend: campo ausente, `null` o cadena vacía. La cadena
 * vacía es la más traicionera: pintaría un hueco en blanco donde debería no haber línea, y en un
 * resumen de compra un hueco en blanco se lee como «cero».
 *
 * <p>Vive en `core` y no dentro de una feature porque el problema es de TODA la frontera con el
 * backend: el dominio solo entiende «ausente», y el servidor manda las tres formas en cualquier
 * respuesta. Estaba dentro de la compra y las demás features no lo usaban; por eso un producto sin
 * rebaja —`originalFormatted: null`— tumbaba la portada entera de la aplicación.
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
