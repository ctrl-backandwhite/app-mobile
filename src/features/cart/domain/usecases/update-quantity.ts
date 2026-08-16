import { CartLine, LineRef, removeLine, sameLine, withQuantity } from '../entities/cart-line'
import { CartStorage } from '../ports/cart-storage'

export class UpdateQuantity {
  constructor(private readonly storage: CartStorage) {}

  /**
   * Fija la cantidad de una línea y devuelve la cesta resultante.
   *
   * Cero significa quitarla: es lo que hace el paso a la baja del selector cuando llega al final, y
   * dejar una línea de cero unidades enseñaría una fila que no se compra. Cualquier otra cantidad
   * por debajo del pedido mínimo se sube al mínimo, porque el backend rechazaría el pedido entero.
   */
  async execute(ref: LineRef, quantity: number): Promise<CartLine[]> {
    const current = await this.storage.load()
    const lines =
      quantity <= 0
        ? removeLine(current, ref)
        : current.map((line) => (sameLine(line, ref) ? withQuantity(line, quantity) : line))
    await this.storage.save(lines)
    return lines
  }
}
