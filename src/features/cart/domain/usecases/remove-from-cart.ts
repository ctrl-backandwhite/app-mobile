import { CartLine, LineRef, removeLine } from '../entities/cart-line'
import { CartStorage } from '../ports/cart-storage'

export class RemoveFromCart {
  constructor(private readonly storage: CartStorage) {}

  /** Quita la línea —solo esa variante— y devuelve la cesta resultante. */
  async execute(ref: LineRef): Promise<CartLine[]> {
    const lines = removeLine(await this.storage.load(), ref)
    await this.storage.save(lines)
    return lines
  }
}
