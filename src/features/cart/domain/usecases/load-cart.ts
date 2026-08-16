import { CartLine } from '../entities/cart-line'
import { CartStorage } from '../ports/cart-storage'

export class LoadCart {
  constructor(private readonly storage: CartStorage) {}

  /** Rehidrata la cesta guardada en el dispositivo al arrancar la app. */
  async execute(): Promise<CartLine[]> {
    return this.storage.load()
  }
}
