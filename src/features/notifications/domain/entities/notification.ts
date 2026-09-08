/**
 * Un aviso de la plataforma.
 *
 * <p>Es el buzón DENTRO de la aplicación, no un aviso del sistema operativo: el backend guarda estos
 * mensajes y la app los lee. Los avisos push nativos necesitan además que el servidor registre el
 * identificador del dispositivo, y eso todavía no existe.
 *
 * <p>`payload` no se modela: es un JSON libre que cada tipo de evento rellena a su manera, y darle
 * forma aquí obligaría a tocar la app cada vez que el backend añade un campo que la app no usa.
 */
export interface PlatformNotification {
  readonly id: string
  readonly title: string
  readonly body: string
  readonly eventType: string
  readonly read: boolean
  readonly createdAt: string
}

/** Cuántos quedan por leer. Se cuenta sobre lo que hay, sin pedirlo otra vez al servidor. */
export function unreadCountOf(notifications: readonly PlatformNotification[]): number {
  return notifications.filter((n) => !n.read).length
}
