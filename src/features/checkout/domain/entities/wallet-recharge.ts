/**
 * Un importe sugerido de recarga.
 *
 * <p>Los sugiere el BACKEND, ya redondeados y formateados en la divisa activa. La app no los calcula:
 * redondear aquí daría cifras distintas a las del escritorio y, en monedas sin decimales, importes
 * que la pasarela rechaza.
 */
export interface RechargePreset {
  readonly amount: number
  readonly formatted: string
}

export interface RechargeOptions {
  readonly currency: string
  readonly symbol: string
  readonly presets: readonly RechargePreset[]
}

/**
 * Cómo se paga la recarga.
 *
 * <p>El USDT del escritorio no está: pide enseñar una dirección de cadena con su QR y esperar
 * confirmaciones, que es un flujo aparte y no el de «recargar y seguir comprando». Se hace en el
 * escritorio.
 */
export type RechargeMethod = 'CARD' | 'PAYPAL'

/**
 * Recarga abierta.
 *
 * <p>Que la pasarela devuelva algo NO significa que el dinero se haya movido. Con tarjeta llega un
 * `clientSecret` que hay que confirmar con el banco; con PayPal, una dirección de aprobación a la que
 * se envía a la persona. En los dos casos, quien decide si el saldo sube es el backend al cerrar.
 */
export interface Recharge {
  readonly paymentId: string
  readonly status: string
  readonly chargeFormatted: string
  readonly clientSecret?: string
  readonly approveUrl?: string
}

/** Un importe vale si es un número mayor que cero: el resto lo decide el backend y la pasarela. */
export function isValidRechargeAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0
}
