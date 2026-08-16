import { WalletBalance } from '@features/checkout/domain/entities/wallet'

import { WalletDto } from '../dto/checkout.dto'

import { text } from './nullable'

export function toWalletBalance(dto: WalletDto): WalletBalance {
  return {
    availableUsdCents: dto.availableUsdCents,
    balanceFormatted: text(dto.balanceFormatted),
    currency: dto.displayCurrency,
    status: dto.status,
  }
}
