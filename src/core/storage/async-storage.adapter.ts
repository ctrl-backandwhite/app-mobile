import AsyncStorage from '@react-native-async-storage/async-storage'
import { logger } from '@core/logger/logger'
import { PreferenceStore } from './ports'

/**
 * Misma tolerancia a fallo que el almacén seguro: una preferencia ilegible no es un error de
 * negocio, es volver al valor por defecto. Si esto propagara, un disco lleno o una base corrupta
 * dejarían la aplicación sin arrancar por no poder recordar la divisa.
 */
export class AsyncPreferenceStore implements PreferenceStore {
  async get(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key)
    } catch (error) {
      logger.warn(`No se pudo leer «${key}» de las preferencias`, error)
      return null
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value)
    } catch (error) {
      logger.warn(`No se pudo guardar «${key}» en las preferencias`, error)
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key)
    } catch (error) {
      logger.warn(`No se pudo borrar «${key}» de las preferencias`, error)
    }
  }
}
