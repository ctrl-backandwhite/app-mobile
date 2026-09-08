import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import { logger } from '@core/logger/logger'
import { PushDevice, PushDeviceGateway } from '@features/notifications/domain/ports/push-registry'

/**
 * El token de avisos que emite el servicio de Expo para ESTE dispositivo.
 *
 * <p>Devuelve `null` en todos los casos en los que este teléfono no va a recibir avisos, que son
 * varios y todos normales: un emulador —donde no hay servicios de mensajería—, el permiso denegado,
 * o una compilación sin el identificador del proyecto. Ninguno es un fallo que enseñar: el buzón
 * dentro de la aplicación sigue estando y la tienda funciona igual.
 */
export class ExpoPushGateway implements PushDeviceGateway {
  async obtainToken(): Promise<PushDevice | null> {
    // En un emulador no hay servicios de mensajería que emitan el token. Preguntar igualmente
    // devuelve un error del sistema que no dice nada útil.
    if (!Device.isDevice) return null

    try {
      const permiso = await this.asegurarPermiso()
      if (!permiso) return null

      const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined
      if (!projectId) {
        // Sin el identificador del proyecto, Expo no sabe a qué aplicación emitir el token.
        logger.warn('Sin projectId de EAS: no se piden avisos push')
        return null
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId })
      return { token: token.data, platform: Platform.OS }
    } catch (error) {
      logger.warn('No se ha podido obtener el token de avisos', error)
      return null
    }
  }

  /**
   * Pide el permiso solo si no está ya concedido.
   *
   * <p>Volver a pedirlo cuando ya se denegó no vuelve a preguntar —el sistema devuelve la denegación
   * directamente— y en iOS gasta la única oportunidad que da de mostrar el diálogo.
   */
  private async asegurarPermiso(): Promise<boolean> {
    const actual = await Notifications.getPermissionsAsync()
    if (actual.granted) return true
    if (!actual.canAskAgain) return false

    const pedido = await Notifications.requestPermissionsAsync()
    return pedido.granted
  }
}
