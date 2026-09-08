import { AppError } from '@core/errors/app-error'
import { call } from '@core/http/call'
import { HttpClient } from '@core/http/http-client'
import { Result } from '@core/result/result'
import { Page } from '@features/catalog/domain/entities/page'
import { WalletBalance } from '@features/checkout/domain/entities/wallet'
import { WalletTransaction } from '@features/checkout/domain/entities/wallet-transaction'
import { WalletRepository } from '@features/checkout/domain/ports/wallet-repository'

import { walletDto, walletTransactionPageDto } from '../dto/checkout.dto'
import { toWalletBalance, toWalletTransactionPage } from '../mappers/wallet.mapper'

export class HttpWalletRepository implements WalletRepository {
  constructor(private readonly http: HttpClient) {}

  async balance(): Promise<Result<WalletBalance, AppError>> {
    return call(
      () => this.http.get('/me/wallet'),
      (raw) => toWalletBalance(walletDto.parse(raw)),
      'El saldo del monedero no tiene el formato esperado.',
    )
  }

  async transactions(page: number, size: number): Promise<Result<Page<WalletTransaction>, AppError>> {
    return call(
      () => this.http.get('/me/wallet/transactions', { params: { page, size } }),
      (raw) => toWalletTransactionPage(walletTransactionPageDto.parse(raw)),
      'El histórico del monedero no tiene el formato esperado.',
    )
  }
}
