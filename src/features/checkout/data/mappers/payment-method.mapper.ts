import { PaymentMethod } from '@features/checkout/domain/entities/payment-method'
import { SavedCardCharge } from '@features/checkout/domain/ports/payment-methods-repository'

import { PaymentMethodDto, SavedCardChargeDto } from '../dto/checkout.dto'

import { num, text } from './nullable'

const KNOWN_TYPES = ['CARD', 'PAYPAL'] as const

/**
 * Traduce los métodos guardados y DESCARTA los de un tipo que la app no sabe cobrar.
 *
 * Enseñar un método que no se puede usar es peor que no enseñarlo: la persona lo elige, pulsa pagar
 * y descubre en el error que ese botón nunca iba a funcionar.
 */
export function toPaymentMethods(dtos: readonly PaymentMethodDto[]): PaymentMethod[] {
  return dtos
    .filter((dto): boolean => KNOWN_TYPES.some((type) => type === dto.type))
    .map((dto) => ({
      id: dto.id,
      type: dto.type === 'PAYPAL' ? ('PAYPAL' as const) : ('CARD' as const),
      brand: text(dto.brand),
      last4: text(dto.last4),
      expMonth: num(dto.expMonth),
      expYear: num(dto.expYear),
      paypalEmail: text(dto.paypalEmail),
      isDefault: dto.isDefault,
    }))
}

/**
 * Un estado que no sea `succeeded` se trata como «falta autenticación».
 *
 * Es la lectura prudente: dar por cobrado lo que no se entiende vaciaría la cesta de alguien que no
 * ha pagado, mientras que lo contrario solo pide un paso más.
 */
export function toSavedCardCharge(dto: SavedCardChargeDto): SavedCardCharge {
  return {
    status: dto.status === 'succeeded' ? 'succeeded' : 'requires_action',
    clientSecret: text(dto.clientSecret),
    paymentId: text(dto.paymentId),
  }
}
