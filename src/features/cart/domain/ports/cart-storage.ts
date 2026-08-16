import { CartLine } from '../entities/cart-line'

/**
 * Almacén de la cesta ACTIVA, que vive en el dispositivo.
 *
 * No devuelve `Result`: leer la cesta no es una operación que la persona pueda reintentar, y un
 * fallo del almacén se resuelve con una cesta vacía en la implementación, no propagándolo hasta la
 * pantalla. Lo que sí vive en el backend es «guardar para más tarde» (`SavedCartRepository`), que
 * está ligado a la cuenta y se comparte entre dispositivos.
 */
export interface CartStorage {
  load(): Promise<CartLine[]>
  save(lines: readonly CartLine[]): Promise<void>
  clear(): Promise<void>
}
