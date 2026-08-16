import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { WalletBalance } from '../entities/wallet'
import { WalletRepository } from '../ports/wallet-repository'

export class GetWalletBalance {
  constructor(private readonly wallet: WalletRepository) {}

  /** Saldo disponible para pagar con monedero, con el importe ya formateado por el backend. */
  async execute(): Promise<Result<WalletBalance, AppError>> {
    return this.wallet.balance()
  }
}
