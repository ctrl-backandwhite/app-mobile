/** Formas de cobro que el backend acepta al tramitar. */
export type PaymentKind = 'WALLET' | 'CARD' | 'PAYPAL'

/**
 * Método de pago GUARDADO en el perfil: una tarjeta de Stripe o una cuenta de PayPal.
 *
 * Nunca viaja ni se guarda un número de tarjeta: `id` es la referencia opaca del proveedor
 * (`pm_…` para tarjeta, `paypal:<uuid>` para PayPal) y los cuatro últimos dígitos solo sirven para
 * que la persona reconozca cuál es cuál.
 */
export interface PaymentMethod {
  readonly id: string
  readonly type: 'CARD' | 'PAYPAL'
  readonly brand?: string
  readonly last4?: string
  readonly expMonth?: number
  readonly expYear?: number
  /** Correo enmascarado por el backend (j***@dominio); solo en PayPal. */
  readonly paypalEmail?: string
  readonly isDefault: boolean
}

/** Lo elegido para pagar: la forma de cobro y, si aplica, el método guardado con el que se cobra. */
export interface PaymentSelection {
  readonly kind: PaymentKind
  readonly savedMethodId?: string
}

const KIND_LABELS: Record<PaymentKind, string> = {
  WALLET: 'Monedero',
  CARD: 'Tarjeta',
  PAYPAL: 'PayPal',
}

/** Nombre de la forma de pago para los botones genéricos. */
export function kindLabel(kind: PaymentKind): string {
  return KIND_LABELS[kind]
}

/**
 * Cómo se nombra un método guardado en la lista: «VISA •••• 4242» o «PayPal · j***@dominio».
 *
 * Los datos que faltan no se inventan ni dejan un hueco raro: una tarjeta sin marca es «Tarjeta» y
 * un PayPal sin correo es «PayPal» a secas.
 */
export function paymentLabel(method: PaymentMethod): string {
  if (method.type === 'PAYPAL') {
    return method.paypalEmail ? `PayPal · ${method.paypalEmail}` : 'PayPal'
  }
  const brand = method.brand ? method.brand.toUpperCase() : 'Tarjeta'
  return method.last4 ? `${brand} •••• ${method.last4}` : brand
}

/** Caducidad «04/27» para la línea secundaria de una tarjeta; nada si el backend no la manda. */
export function expiryLabel(method: PaymentMethod): string | undefined {
  if (method.type !== 'CARD' || !method.expMonth || !method.expYear) return undefined
  const month = String(method.expMonth).padStart(2, '0')
  return `${month}/${String(method.expYear).slice(-2)}`
}

/** El método marcado por defecto o, si no hay ninguno, el primero de la lista. */
export function defaultPaymentMethod(methods: readonly PaymentMethod[]): PaymentMethod | undefined {
  return methods.find((method) => method.isDefault) ?? methods[0]
}

/** Traduce un método guardado a la elección de pago que entiende la tramitación. */
export function selectionFor(method: PaymentMethod): PaymentSelection {
  return { kind: method.type, savedMethodId: method.id }
}

/**
 * Identificador de la tarjeta guardada con la que hay que cobrar DESPUÉS de crear el pedido.
 *
 * Solo lo hay cuando se paga con una tarjeta del perfil: con monedero cobra la propia tramitación y
 * con PayPal el cobro ocurre fuera de la aplicación.
 */
export function savedCardId(selection?: PaymentSelection): string | undefined {
  if (!selection || selection.kind !== 'CARD') return undefined
  return selection.savedMethodId
}
