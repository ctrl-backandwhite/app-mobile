/**
 * Dirección de envío guardada en la cuenta.
 *
 * Vive en el backend y no en el dispositivo: es la misma libreta que usa el panel web, así que lo
 * que se da de alta en el móvil aparece en el escritorio y al revés.
 */
export interface Address {
  readonly id: string
  readonly label?: string
  readonly fullName: string
  readonly phone?: string
  readonly line1: string
  readonly line2?: string
  readonly city: string
  /** Código del estado/provincia. El impuesto de US, CA y BR se calcula por región, no por país. */
  readonly state?: string
  readonly postalCode?: string
  /** ISO-3166 alfa-2 en mayúsculas: es lo que espera la cotización de portes. */
  readonly country: string
  readonly isDefault: boolean
}

/** Lo que se teclea al dar de alta una dirección; el identificador lo pone el backend. */
export interface NewAddress {
  readonly label?: string
  readonly fullName: string
  readonly phone?: string
  readonly line1: string
  readonly line2?: string
  readonly city: string
  readonly state?: string
  readonly postalCode?: string
  readonly country: string
  readonly isDefault?: boolean
}

function filled(value?: string): boolean {
  return value !== undefined && value.trim().length > 0
}

/**
 * Campos sin los que el backend no puede enviar nada: destinatario, calle, ciudad y país.
 *
 * El resto son opcionales de verdad —hay países sin código postal y direcciones sin provincia—, así
 * que exigirlos dejaría fuera destinos válidos.
 */
export function isCompleteAddress(address: NewAddress): boolean {
  return (
    filled(address.fullName) &&
    filled(address.line1) &&
    filled(address.city) &&
    address.country.trim().length === 2
  )
}

/**
 * La que se propone al abrir la compra: la marcada como predeterminada y, si no hay ninguna, la
 * primera. Sin propuesta, quien tiene una sola dirección tendría que elegirla igualmente.
 */
export function defaultAddress(addresses: readonly Address[]): Address | undefined {
  return addresses.find((address) => address.isDefault) ?? addresses[0]
}

/** Una línea con lo imprescindible para reconocer la dirección en la lista. */
export function addressSummary(address: Address, countryName?: string): string {
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    // El nombre del país llega de fuera —lo sirve el backend traducido— porque el dominio no puede
    // tener una tabla de países: serían doscientas filas en ocho idiomas que mantener a mano.
    countryName ?? address.country,
  ]
  return parts.filter((part) => filled(part)).join(', ')
}

/** Nombre visible de la ficha: la etiqueta que puso la persona o, si no la puso, el destinatario. */
export function addressTitle(address: Address): string {
  return filled(address.label) ? (address.label as string) : address.fullName
}
