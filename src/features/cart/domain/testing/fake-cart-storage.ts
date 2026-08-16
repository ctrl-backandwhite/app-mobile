import { CartLine } from '../entities/cart-line'
import { CartStorage } from '../ports/cart-storage'

/** Cesta en memoria. Registra las escrituras para poder afirmar que algo NO se guardó. */
export class FakeCartStorage implements CartStorage {
  saves = 0
  cleared = false

  constructor(private lines: CartLine[] = []) {}

  async load(): Promise<CartLine[]> {
    return [...this.lines]
  }

  async save(lines: readonly CartLine[]): Promise<void> {
    this.saves += 1
    this.lines = [...lines]
  }

  async clear(): Promise<void> {
    this.cleared = true
    this.lines = []
  }
}
