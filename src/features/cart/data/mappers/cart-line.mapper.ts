import { CartLine } from '@features/cart/domain/entities/cart-line'

import { CartLineDto } from '../dto/cart.dto'

/**
 * Traduce la línea del backend a la entidad del dominio. Los `null` se convierten en ausencia
 * porque el dominio distingue «no hay variante» con `undefined`, y un `null` colado ahí rompería la
 * comparación entre líneas.
 */
export function toCartLine(dto: CartLineDto): CartLine {
  return {
    productId: dto.productId,
    variantId: dto.variantId ?? undefined,
    slug: dto.slug,
    title: dto.title,
    image: dto.image ?? undefined,
    variantLabel: dto.variantLabel ?? undefined,
    sku: dto.sku ?? undefined,
    quantity: dto.quantity,
    moq: dto.moq ?? undefined,
  }
}
