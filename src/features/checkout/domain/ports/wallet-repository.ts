import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'
import { Page } from '@features/catalog/domain/entities/page'

import { WalletBalance } from '../entities/wallet'
import {
  Recharge,
  RechargeMethod,
  RechargeOptions,
} from '../entities/wallet-recharge'
import { WalletTransaction } from '../entities/wallet-transaction'

export interface StartRecharge {
  readonly method: RechargeMethod
  /** Importe en la divisa ACTIVA. El dólar canónico y la moneda de cobro los deriva el backend. */
  readonly amount: number
  readonly currency: string
}

export interface WalletRepository {
  balance(): Promise<Result<WalletBalance, AppError>>
  transactions(page: number, size: number): Promise<Result<Page<WalletTransaction>, AppError>>
  rechargeOptions(currency: string): Promise<Result<RechargeOptions, AppError>>
  startRecharge(request: StartRecharge): Promise<Result<Recharge, AppError>>
  confirmRecharge(paymentId: string): Promise<Result<void, AppError>>
  capturePayPal(paymentId: string): Promise<Result<void, AppError>>
}
