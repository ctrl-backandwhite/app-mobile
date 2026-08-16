import { AppError } from '@core/errors/app-error'

/**
 * Mensajes de la compra que la aplicación pone de su parte.
 *
 * El resto de textos los traduce el backend con la cabecera X-Lang y se pintan tal cual. Aquí solo
 * se reescriben los fallos cuyo mensaje del servidor no dice a la persona QUÉ HACER, que en una
 * pantalla de pago es lo único que importa.
 */
export const CHECKOUT_MESSAGES = {
  noAddress: 'Elige una dirección de envío antes de confirmar.',
  noPayment: 'Elige cómo quieres pagar antes de confirmar.',
  emptyCart: 'No hay nada que comprar: tu cesta está vacía.',
  insufficientWallet:
    'Tu monedero no tiene saldo suficiente para este pedido. Recárgalo o paga con otro método.',
  staleItem:
    'Alguno de los artículos ya no está disponible. Revisa la cesta y vuelve a intentarlo.',
  unsupportedCountry: 'Todavía no enviamos a ese país. Elige otra dirección de envío.',
  customsBlocked:
    'Este pedido supera el límite de importación del destino. Divídelo en pedidos más pequeños.',
  cardAuthentication:
    'Tu banco pide una autenticación que no se ha completado. El pedido está creado y sin cobrar: vuelve a intentarlo cuando quieras.',
  /** Se avisa antes de salir: la persona debe saber que va a cambiar de aplicación y volverá. */
  paypalCancelled: 'Has cancelado el pago. Tu pedido queda pendiente y puedes reintentarlo.',
  paypalRedirect: 'Se abrirá PayPal para autorizar el pago y volverás aquí al terminar.',
  paypalUnavailable:
    'El pago con PayPal todavía no se puede completar desde la app. Usa el monedero o una tarjeta guardada.',
} as const

/** El backend avisa del saldo corto con este texto, y es el fallo más común al pagar con monedero. */
const INSUFFICIENT = /insufficient wallet balance|saldo insuficiente/i
/** Una variante que ya no existe: el catálogo se reimportó y la línea guardada quedó obsoleta. */
const STALE_ITEM = /cart_item_unavailable/i

/**
 * Traduce el fallo del backend al mensaje que se enseña bajo el botón de confirmar.
 *
 * Un mensaje del servidor siempre gana al de reserva —viene traducido y es más concreto—, salvo en
 * los dos casos en los que su texto es una descripción técnica que no explica qué hacer.
 */
export function checkoutErrorMessage(error: AppError): string {
  if (INSUFFICIENT.test(error.message)) return CHECKOUT_MESSAGES.insufficientWallet
  if (STALE_ITEM.test(error.message)) return CHECKOUT_MESSAGES.staleItem
  if (error.code === 'CONTRACT') {
    return 'La respuesta del servidor no se ha entendido. Vuelve a intentarlo en un momento.'
  }
  return error.message
}
