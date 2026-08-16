import { CartQuote } from '@features/cart/domain/entities/cart-quote'

import { CartQuoteDto } from '../dto/cart.dto'

export function toCartQuote(dto: CartQuoteDto): CartQuote {
  return {
    currency: dto.currency,
    symbol: dto.symbol,
    items: dto.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId ?? undefined,
      unitFormatted: item.unitFormatted,
      lineTotalFormatted: item.lineTotalFormatted,
    })),
    subtotalFormatted: dto.subtotalFormatted,
  }
}
