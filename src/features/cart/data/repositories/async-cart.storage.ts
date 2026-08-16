import { logger } from '@core/logger/logger'
import { PreferenceStore } from '@core/storage/ports'
import { CartLine } from '@features/cart/domain/entities/cart-line'
import { CartStorage } from '@features/cart/domain/ports/cart-storage'

import { cartLinesDto } from '../dto/cart.dto'
import { toCartLine } from '../mappers/cart-line.mapper'

/**
 * La cesta no lleva credenciales ni datos personales, así que va al almacén sin cifrar. El puerto se
 * inyecta en lugar de usar AsyncStorage directamente: así el dominio se prueba sin módulos nativos y
 * cambiar de almacén no toca esta clase.
 */
const CART_KEY = 'nx036.cart'

export class AsyncCartStorage implements CartStorage {
  constructor(private readonly preferences: PreferenceStore) {}

  /**
   * Un JSON corrupto —o escrito por una versión con otra forma— devuelve cesta vacía en vez de
   * propagar: perder la cesta es un incordio, pero no poder abrir la app es un fallo grave.
   */
  async load(): Promise<CartLine[]> {
    const raw = await this.preferences.get(CART_KEY)
    if (!raw) return []
    try {
      return cartLinesDto.parse(JSON.parse(raw)).map(toCartLine)
    } catch (error) {
      logger.warn('La cesta guardada no se pudo leer; se empieza vacía', error)
      return []
    }
  }

  async save(lines: readonly CartLine[]): Promise<void> {
    await this.preferences.set(CART_KEY, JSON.stringify(lines))
  }

  async clear(): Promise<void> {
    await this.preferences.remove(CART_KEY)
  }
}
