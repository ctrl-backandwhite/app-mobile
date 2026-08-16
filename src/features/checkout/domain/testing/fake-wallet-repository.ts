import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { WalletBalance } from '../entities/wallet'
import { WalletRepository } from '../ports/wallet-repository'

import { aWalletBalance } from './checkout-builders'

interface Config {
  balance?: WalletBalance
  error?: AppError
}

export class FakeWalletRepository implements WalletRepository {
  calls = 0

  constructor(private readonly config: Config = {}) {}

  async balance(): Promise<Result<WalletBalance, AppError>> {
    this.calls += 1
    if (this.config.error) return err(this.config.error)
    return ok(this.config.balance ?? aWalletBalance())
  }
}
