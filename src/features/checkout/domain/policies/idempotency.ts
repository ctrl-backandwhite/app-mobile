import { CheckoutItem } from '../entities/checkout-draft'

/**
 * Clave de idempotencia de una tramitación.
 *
 * En un móvil la conexión se corta a mitad de la petición y la persona vuelve a pulsar sin saber si
 * el pedido llegó a crearse. Con esta cabecera el backend reconoce el reintento y devuelve el pedido
 * que ya había creado en vez de cobrar una segunda vez.
 *
 * Por eso la clave se DERIVA del contenido de la cesta y no de un azar: dos intentos de la misma
 * compra comparten clave —aunque la app se haya reiniciado entre medias— y una cesta distinta
 * estrena la suya. Es el mismo criterio que usa el panel web, así que la misma cesta tramitada desde
 * los dos sitios tampoco duplica el pedido.
 */
export function checkoutIdempotencyKey(items: readonly CheckoutItem[]): string {
  const signature = items
    .map((item) => `${item.productId}:${item.variantId ?? ''}:${item.quantity}`)
    .sort()
    .join('|')

  // Hash de 32 bits al estilo del de Java: basta para distinguir cestas y cabe en una cabecera.
  let hash = 0
  for (let index = 0; index < signature.length; index += 1) {
    hash = (hash * 31 + signature.charCodeAt(index)) | 0
  }
  return `cart-${(hash >>> 0).toString(36)}-${items.length}`
}
