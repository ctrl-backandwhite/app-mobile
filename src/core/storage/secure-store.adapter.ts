import * as SecureStore from 'expo-secure-store'
import { logger } from '@core/logger/logger'
import { SecretStore } from './ports'

/**
 * El almacén seguro puede fallar (dispositivo sin bloqueo de pantalla, almacén corrupto, entrada
 * escrita por una versión anterior con otra clave). Un fallo al leer equivale a no tener sesión: se
 * degrada a null en vez de tumbar el arranque de la aplicación.
 *
 * Escribir y borrar tampoco propagan: quien cierra sesión no puede quedarse atrapado porque el
 * Keychain rechace la operación.
 */
export class ExpoSecretStore implements SecretStore {
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key)
    } catch (error) {
      logger.warn(`No se pudo leer «${key}» del almacén seguro`, error)
      return null
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch (error) {
      logger.warn(`No se pudo guardar «${key}» en el almacén seguro`, error)
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch (error) {
      logger.warn(`No se pudo borrar «${key}» del almacén seguro`, error)
    }
  }
}
