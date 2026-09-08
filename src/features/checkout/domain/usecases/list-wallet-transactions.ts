import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'
import { Page } from '@features/catalog/domain/entities/page'

import { WalletTransaction } from '../entities/wallet-transaction'
import { WalletRepository } from '../ports/wallet-repository'

/** El tamaño de página del backend está topado en 100; 20 llena una pantalla sin pedir de más. */
export const WALLET_PAGE_SIZE = 20

export class ListWalletTransactions {
  constructor(private readonly wallet: WalletRepository) {}

  execute(page: number): Promise<Result<Page<WalletTransaction>, AppError>> {
    return this.wallet.transactions(Math.max(0, page), WALLET_PAGE_SIZE)
  }
}
