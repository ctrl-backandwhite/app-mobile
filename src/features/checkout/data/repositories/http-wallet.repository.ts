import { AppError } from '@core/errors/app-error'
import { HttpClient } from '@core/http/http-client'
import { Result } from '@core/result/result'
import { WalletBalance } from '@features/checkout/domain/entities/wallet'
import { WalletRepository } from '@features/checkout/domain/ports/wallet-repository'

import { walletDto } from '../dto/checkout.dto'
import { toWalletBalance } from '../mappers/wallet.mapper'

import { call } from './http-call'

export class HttpWalletRepository implements WalletRepository {
  constructor(private readonly http: HttpClient) {}

  async balance(): Promise<Result<WalletBalance, AppError>> {
    return call(
      () => this.http.get('/me/wallet'),
      (raw) => toWalletBalance(walletDto.parse(raw)),
      'El saldo del monedero no tiene el formato esperado.',
    )
  }
}
