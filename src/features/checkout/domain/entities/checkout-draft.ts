import { Address } from './address'
import { PaymentSelection } from './payment-method'

/** Lo único que el backend necesita de cada línea para tramitar: qué se compra y cuánto. */
export interface CheckoutItem {
  readonly productId: string
  readonly variantId?: string
  readonly quantity: number
}

/**
 * Lo que la persona lleva decidido de su compra.
 *
 * No guarda ningún importe: el precio, los portes y el total los calcula el backend a partir de las
 * líneas y del destino, y se piden cada vez que cambia algo.
 */
export interface CheckoutDraft {
  readonly address?: Address
  readonly payment?: PaymentSelection
  readonly couponCode?: string
  readonly notes?: string
}

/** Lo que falta por decidir antes de poder confirmar. */
export type CheckoutRequirement = 'address' | 'payment'

export function missingRequirements(draft: CheckoutDraft): CheckoutRequirement[] {
  const missing: CheckoutRequirement[] = []
  if (!draft.address) missing.push('address')
  if (!draft.payment) missing.push('payment')
  return missing
}

/**
 * Se puede tramitar cuando hay dirección y forma de pago.
 *
 * Son las dos decisiones que la aplicación no puede tomar por nadie: sin destino no hay portes que
 * cobrar y sin método de pago el pedido nacería pendiente y sin forma de pagarse.
 */
export function canPlaceOrder(draft: CheckoutDraft): boolean {
  return missingRequirements(draft).length === 0
}

/** País al que se cotizan los portes. Sin dirección elegida no hay destino que cotizar. */
export function shippingCountry(draft: CheckoutDraft): string | undefined {
  return draft.address?.country
}

/** Región del destino: el impuesto de US, CA y BR depende de ella. */
export function shippingRegion(draft: CheckoutDraft): string | undefined {
  const state = draft.address?.state
  return state !== undefined && state.trim().length > 0 ? state : undefined
}
