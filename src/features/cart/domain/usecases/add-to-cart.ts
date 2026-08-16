import { CartLine, upsertLine } from '../entities/cart-line'
import { CartStorage } from '../ports/cart-storage'

export class AddToCart {
  constructor(private readonly storage: CartStorage) {}

  /**
   * Añade la línea y devuelve la cesta resultante.
   *
   * Añadir dos veces lo mismo SUMA unidades en lugar de duplicar la fila: dos filas iguales con
   * cantidades distintas son imposibles de entender y el pedido acabaría con dos envíos del mismo
   * artículo.
   */
  async execute(line: CartLine): Promise<CartLine[]> {
    const lines = upsertLine(await this.storage.load(), line)
    await this.storage.save(lines)
    return lines
  }
}
