import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { CartLine } from '../entities/cart-line'
import { SavedCartRepository } from '../ports/saved-cart-repository'

interface Config {
  saved?: CartLine[]
  error?: AppError
}

export class FakeSavedCartRepository implements SavedCartRepository {
  listed = 0
  savedLines: CartLine[] = []
  removed: { productId: string; variantId?: string }[] = []
  merged: CartLine[][] = []

  constructor(private readonly config: Config = {}) {}

  private answer(): Result<CartLine[], AppError> {
    if (this.config.error) return err(this.config.error)
    return ok(this.config.saved ?? [])
  }

  async list(): Promise<Result<CartLine[], AppError>> {
    this.listed += 1
    return this.answer()
  }

  async save(line: CartLine): Promise<Result<CartLine[], AppError>> {
    this.savedLines.push(line)
    return this.answer()
  }

  async remove(productId: string, variantId?: string): Promise<Result<CartLine[], AppError>> {
    this.removed.push({ productId, variantId })
    return this.answer()
  }

  async merge(lines: readonly CartLine[]): Promise<Result<CartLine[], AppError>> {
    this.merged.push([...lines])
    return this.answer()
  }
}
