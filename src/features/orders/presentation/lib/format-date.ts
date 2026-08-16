/**
 * Hueco discreto. Se usa igual para una fecha ausente que para una ilegible: en las dos el dato no
 * existe, y un «Invalid Date» en mitad del histórico asusta más de lo que informa.
 */
const NO_DATE = '—'

function parse(iso: string | undefined): Date | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Fecha corta: la del pedido en la tarjeta y en la cabecera del detalle. */
export function formatDate(iso: string | undefined): string {
  const date = parse(iso)
  if (!date) return NO_DATE
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Fecha con hora: un paso del seguimiento sin hora no deja saber en qué orden ocurrió. */
export function formatDateTime(iso: string | undefined): string {
  const date = parse(iso)
  if (!date) return NO_DATE
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
