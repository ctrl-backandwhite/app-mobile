import Constants from 'expo-constants'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

/**
 * Cómo se presenta la aplicación ante el backend.
 *
 * <p>Sin esto la petición salía como `okhttp/4.9.2`, y el backend —que nombra el dispositivo a
 * partir de este texto— registraba la sesión del teléfono como «Navegador», sin sistema y sin
 * modelo. En la lista de sesiones abiertas, el móvil era indistinguible de cualquier otra cosa y no
 * había forma de saber cuál cerrar.
 *
 * <p>El formato imita al de un navegador porque es el que el backend ya sabe leer: nombre/versión y,
 * entre paréntesis, el sistema y el aparato.
 */
export function userAgent(): string {
  const version = Constants.expoConfig?.version ?? '0'
  const system = Platform.OS === 'ios' ? 'iOS' : 'Android'
  const model = Device.modelName
  return `NX036/${version} (${system} ${String(Platform.Version)}${model ? `; ${model}` : ''})`
}
