import { HttpClient } from '@core/http/http-client'
import { logger } from '@core/logger/logger'
import { CartLine, sameLine } from '@features/cart/domain/entities/cart-line'
import { CartStorage } from '@features/cart/domain/ports/cart-storage'

import { cartLinesDto } from '../dto/cart.dto'
import { toCartLine, toCartLinePayload } from '../mappers/cart-line.mapper'

/**
 * Cesta guardada en el servidor, ligada a la cuenta. Es lo que hace que lo añadido en el panel web
 * aparezca en el móvil y al revés.
 *
 * El puerto habla de «guardar la cesta entera», pero la API es por línea, así que aquí se calcula la
 * diferencia con el último estado conocido y solo se envían los cambios. La alternativa —vaciar y
 * volver a subirlo todo en cada pulsación— dejaría la cesta vacía en el servidor durante un instante
 * y la perdería del todo si la conexión se cortara en medio.
 */
export class HttpCartStorage implements CartStorage {
  private last: CartLine[] = []

  constructor(private readonly http: HttpClient) {}

  async load(): Promise<CartLine[]> {
    try {
      const raw = await this.http.get('/me/cart')
      this.last = cartLinesDto.parse(raw).map(toCartLine)
      return this.last
    } catch (error) {
      // Una cesta que no se puede leer no puede impedir abrir la aplicación: se devuelve vacía y la
      // siguiente operación volverá a intentarlo.
      logger.warn('No se pudo cargar la cesta del servidor', error)
      return []
    }
  }

  async save(lines: readonly CartLine[]): Promise<void> {
    const desired = [...lines]

    const removed = this.last.filter((previous) => !desired.some((line) => sameLine(line, previous)))
    const changed = desired.filter((line) => {
      const previous = this.last.find((candidate) => sameLine(candidate, line))
      return !previous || previous.quantity !== line.quantity
    })

    try {
      for (const line of removed) {
        await this.http.delete(`/me/cart/${line.productId}`, {
          params: line.variantId ? { variantId: line.variantId } : undefined,
        })
      }
      for (const line of changed) {
        // PUT fija la cantidad; no la suma. Así bajar de cinco a dos unidades funciona y un
        // reintento por red inestable no duplica el pedido.
        await this.http.put('/me/cart', toCartLinePayload(line))
      }
      this.last = desired
    } catch (error) {
      // El estado local no se marca como sincronizado: el próximo guardado reintentará lo que falte.
      logger.warn('No se pudo sincronizar la cesta con el servidor', error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      await this.http.delete('/me/cart')
      this.last = []
    } catch (error) {
      logger.warn('No se pudo vaciar la cesta del servidor', error)
      throw error
    }
  }
}
