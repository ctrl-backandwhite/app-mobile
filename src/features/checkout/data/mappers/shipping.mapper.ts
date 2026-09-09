import { ShippingQuote } from '@features/checkout/domain/entities/shipping'

import { ShippingQuoteDto } from '../dto/checkout.dto'

import { text } from '@core/data/nullable'

export function toShippingQuote(dto: ShippingQuoteDto): ShippingQuote {
  return {
    supported: dto.supported,
    countryCode: text(dto.countryCode),
    carrier: text(dto.carrier),
    serviceName: text(dto.serviceName),
    etaMinDays: dto.etaMinDays,
    etaMaxDays: dto.etaMaxDays,
    taxRateBps: dto.taxRateBps,
    subtotalUsdCents: dto.subtotalUsdCents,
    customsHandlingUsdCents: dto.customsHandlingUsdCents,
    discountCents: dto.discountCents,
    subtotalFormatted: text(dto.subtotalFormatted),
    shippingFormatted: text(dto.shippingFormatted),
    shippingBaseFormatted: text(dto.shippingBaseFormatted),
    customsHandlingFormatted: text(dto.customsHandlingFormatted),
    taxFormatted: text(dto.taxFormatted),
    totalFormatted: text(dto.totalFormatted),
    discountFormatted: text(dto.discountFormatted),
    customsThresholdExceeded: dto.customsThresholdExceeded,
    customsBlocked: dto.customsBlocked,
    customsLimit: text(dto.customsLimit),
    taxMode: text(dto.taxMode),
    couponCode: text(dto.couponCode),
    couponError: text(dto.couponError),
  }
}
