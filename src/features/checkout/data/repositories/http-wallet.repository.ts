import { AppError } from '@core/errors/app-error'
import { call } from '@core/http/call'
import { HttpClient } from '@core/http/http-client'
import { Result } from '@core/result/result'
import { Page } from '@features/catalog/domain/entities/page'
import { WalletBalance } from '@features/checkout/domain/entities/wallet'
import { WalletTransaction } from '@features/checkout/domain/entities/wallet-transaction'
import { Recharge, RechargeOptions } from '@features/checkout/domain/entities/wallet-recharge'
import { StartRecharge, WalletRepository } from '@features/checkout/domain/ports/wallet-repository'

import {
  rechargeDto,
  rechargeOptionsDto,
  walletDto,
  walletTransactionPageDto,
} from '../dto/checkout.dto'
import {
  toRecharge,
  toRechargeOptions,
  toWalletBalance,
  toWalletTransactionPage,
} from '../mappers/wallet.mapper'

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

  async rechargeOptions(currency: string): Promise<Result<RechargeOptions, AppError>> {
    return call(
      () => this.http.get('/me/wallet/recharge/options', { params: { currency } }),
      (raw) => toRechargeOptions(rechargeOptionsDto.parse(raw)),
      'Las opciones de recarga no tienen el formato esperado.',
    )
  }

  /**
   * El importe viaja en la divisa ACTIVA. El dólar canónico y la moneda de cobro los deriva el
   * backend: mandarlo ya convertido significaría dos tipos de cambio distintos para un mismo cobro.
   */
  async startRecharge(request: StartRecharge): Promise<Result<Recharge, AppError>> {
    return call(
      () =>
        this.http.post('/me/wallet/recharge', {
          method: request.method,
          currencyDisplay: request.currency,
          amountDisplay: request.amount,
        }),
      (raw) => toRecharge(rechargeDto.parse(raw)),
      'La respuesta de la recarga no tiene el formato esperado.',
    )
  }

  async confirmRecharge(paymentId: string): Promise<Result<void, AppError>> {
    return call(
      () => this.http.post(`/me/wallet/recharge/${paymentId}/confirm`),
      () => undefined,
    )
  }

  async capturePayPal(paymentId: string): Promise<Result<void, AppError>> {
    return call(
      () => this.http.post('/me/wallet/paypal/capture', undefined, { params: { paymentId } }),
      () => undefined,
    )
  }
}
