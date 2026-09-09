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

/**
 * Cuerpo que espera el backend al guardar una línea.
 *
 * No se envía ningún precio: el servidor lo resuelve del catálogo. Mandarlo desde el cliente sería
 * un dato manipulable y, además, quedaría congelado en el momento de añadir.
 */
export function toCartLinePayload(line: CartLine): Record<string, unknown> {
  return {
    productId: line.productId,
    variantId: line.variantId,
    sku: line.sku,
    slug: line.slug,
    title: line.title,
    image: line.image,
    variantLabel: line.variantLabel,
    quantity: line.quantity,
    moq: line.moq,
    // Obligatorios para el servidor: sin ellos la línea se rechaza con un 400 y la cesta no se
    // guarda. Se manda lo que se vio al añadir, no un coste: el importe final lo recalcula él.
    unitPriceSource: line.unitPriceSource ?? 0,
    sourceCurrency: line.sourceCurrency ?? 'USD',
  }
}
