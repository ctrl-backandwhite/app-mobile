import { CartLine } from '@features/cart/domain/entities/cart-line'
import { CartStorage } from '@features/cart/domain/ports/cart-storage'

/**
 * Decide en cada operación dónde vive la cesta: en el servidor si hay sesión, en el dispositivo si
 * no la hay.
 *
 * Se consulta en cada llamada y no al construirlo porque la sesión cambia mientras la aplicación
 * está abierta —al entrar o al salir—, y una decisión tomada al arrancar dejaría a quien acaba de
 * iniciar sesión escribiendo en la cesta del invitado.
 *
 * Quien no ha iniciado sesión también puede llenar la cesta: cortarle el paso obligaría a crear una
 * cuenta antes de saber si el catálogo le interesa. Al entrar, lo que tuviera se funde con lo que ya
 * hubiera en su cuenta.
 */
export class SessionAwareCartStorage implements CartStorage {
  constructor(
    private readonly local: CartStorage,
    private readonly remote: CartStorage,
    private readonly hasSession: () => boolean,
  ) {}

  private current(): CartStorage {
    return this.hasSession() ? this.remote : this.local
  }

  async load(): Promise<CartLine[]> {
    return this.current().load()
  }

  async save(lines: readonly CartLine[]): Promise<void> {
    return this.current().save(lines)
  }

  async clear(): Promise<void> {
    return this.current().clear()
  }

  /** Cesta que quedó en el dispositivo antes de iniciar sesión, para poder fundirla. */
  async guestLines(): Promise<CartLine[]> {
    return this.local.load()
  }

  /** Se llama tras fundir: lo del invitado ya está en el servidor y aquí solo estorbaría. */
  async clearGuest(): Promise<void> {
    return this.local.clear()
  }
}
