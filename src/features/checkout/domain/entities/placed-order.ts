/**
 * Pedido ya creado en el backend.
 *
 * Del pedido solo se recoge lo que la compra necesita: a dónde navegar y qué enseñar mientras tanto.
 * El detalle completo lo sirve la pantalla del pedido, que vuelve a pedirlo al backend.
 */
export interface PlacedOrder {
  readonly id: string
  readonly orderNumber: string
  readonly status: string
  /** Método con el que se creó (WALLET/CARD/PAYPAL): decide qué queda por hacer tras tramitar. */
  readonly paymentMethod?: string
  readonly totalFormatted?: string
  /**
   * Enlace de aprobación de la pasarela externa.
   *
   * HOY EL BACKEND NO LO DEVUELVE al tramitar: la aprobación de PayPal se obtiene con otra llamada
   * (`/me/orders/{id}/payment-intent`) que no forma parte del contrato de esta fase. Se recoge por
   * si llega, para que el día que llegue el pago con PayPal funcione sin tocar nada más.
   */
  readonly approvalUrl?: string
}
