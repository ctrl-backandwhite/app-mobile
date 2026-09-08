import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'
import { Page } from '@features/catalog/domain/entities/page'

import { WalletBalance } from '../entities/wallet'
import { WalletTransaction } from '../entities/wallet-transaction'
import { WalletRepository } from '../ports/wallet-repository'

import { aWalletBalance } from './checkout-builders'

interface Config {
  balance?: WalletBalance
  transactions?: Page<WalletTransaction>
  error?: AppError
}

const VACIA: Page<WalletTransaction> = {
  items: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
}

export class FakeWalletRepository implements WalletRepository {
  calls = 0

  constructor(private readonly config: Config = {}) {}

  async balance(): Promise<Result<WalletBalance, AppError>> {
    this.calls += 1
    if (this.config.error) return err(this.config.error)
    return ok(this.config.balance ?? aWalletBalance())
  }

  async transactions(): Promise<Result<Page<WalletTransaction>, AppError>> {
    if (this.config.error) return err(this.config.error)
    return ok(this.config.transactions ?? VACIA)
  }
}
