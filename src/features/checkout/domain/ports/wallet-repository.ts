import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { WalletBalance } from '../entities/wallet'

export interface WalletRepository {
  balance(): Promise<Result<WalletBalance, AppError>>
}
