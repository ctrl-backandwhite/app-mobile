import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'
import { Page } from '@features/catalog/domain/entities/page'

import { WalletBalance } from '../entities/wallet'
import { WalletTransaction } from '../entities/wallet-transaction'

export interface WalletRepository {
  balance(): Promise<Result<WalletBalance, AppError>>
  transactions(page: number, size: number): Promise<Result<Page<WalletTransaction>, AppError>>
}
