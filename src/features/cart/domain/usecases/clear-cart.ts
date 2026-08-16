import { CartStorage } from '../ports/cart-storage'

export class ClearCart {
  constructor(private readonly storage: CartStorage) {}

  /** Vacía la cesta activa: tras confirmar un pedido y al cerrar sesión. */
  async execute(): Promise<void> {
    await this.storage.clear()
  }
}
