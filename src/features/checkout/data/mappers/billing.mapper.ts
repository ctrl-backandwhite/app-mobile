import { BillingConfig } from '@features/checkout/domain/entities/billing-config'

import { BillingConfigDto } from '../dto/checkout.dto'

import { text } from '@core/data/nullable'

/** Una clave en blanco es una clave que no hay: se descarta para que nadie intente arrancar con ella. */
export function toBillingConfig(dto: BillingConfigDto): BillingConfig {
  return { publishableKey: text(dto.publishableKey), enabled: dto.enabled }
}
