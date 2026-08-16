import { Address, NewAddress } from '@features/checkout/domain/entities/address'

import { AddressDto } from '../dto/checkout.dto'

import { text } from './nullable'

export function toAddress(dto: AddressDto): Address {
  return {
    id: dto.id,
    label: text(dto.label),
    fullName: dto.fullName,
    phone: text(dto.phone),
    line1: dto.line1,
    line2: text(dto.line2),
    city: dto.city,
    state: text(dto.state),
    postalCode: text(dto.postalCode),
    country: dto.country.toUpperCase(),
    isDefault: dto.default,
  }
}

/**
 * Cuerpo del alta. El backend espera `isDefault`, no `default`: son campos distintos —uno entra y
 * otro sale— y confundirlos deja siempre la dirección sin marcar.
 */
export function toAddressPayload(address: NewAddress): Record<string, unknown> {
  return {
    label: address.label,
    fullName: address.fullName.trim(),
    phone: address.phone,
    line1: address.line1.trim(),
    line2: address.line2,
    city: address.city.trim(),
    state: address.state,
    postalCode: address.postalCode,
    country: address.country.toUpperCase(),
    isDefault: address.isDefault ?? false,
  }
}
