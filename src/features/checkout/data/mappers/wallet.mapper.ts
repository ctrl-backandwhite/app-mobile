import { Page } from '@features/catalog/domain/entities/page'
import { WalletBalance } from '@features/checkout/domain/entities/wallet'
import { Recharge, RechargeOptions } from '@features/checkout/domain/entities/wallet-recharge'
import {
  toWalletTransactionKind,
  WalletTransaction,
} from '@features/checkout/domain/entities/wallet-transaction'

import {
  RechargeDto,
  RechargeOptionsDto,
  WalletDto,
  WalletTransactionDto,
  WalletTransactionPageDto,
} from '../dto/checkout.dto'

import { text } from './nullable'

export function toWalletBalance(dto: WalletDto): WalletBalance {
  return {
    availableUsdCents: dto.availableUsdCents,
    balanceFormatted: text(dto.balanceFormatted),
    currency: dto.displayCurrency,
    status: dto.status,
    holdFormatted: (dto.holdUsdCents ?? 0) > 0 ? text(dto.holdUsdFormatted) : undefined,
  }
}

/**
 * El respaldo se escribe en dólares porque los céntimos que llegan SON dólares: la unidad canónica
 * del monedero. Aquí no se convierte nada —eso lo hace el servidor—, solo se da forma a una cifra
 * que ya viene en la moneda correcta.
 */
export function toWalletTransaction(dto: WalletTransactionDto): WalletTransaction {
  const signo = dto.amountUsdCents >= 0 ? '+' : '-'
  const importe = Math.abs(dto.amountUsdCents) / 100
  return {
    id: dto.id,
    kind: toWalletTransactionKind(dto.kind),
    amountFormatted: text(dto.amountFormatted) ?? `${signo}$${importe.toFixed(2)}`,
    balanceAfterFormatted:
      text(dto.balanceAfterFormatted) ?? `$${(dto.balanceAfterCents / 100).toFixed(2)}`,
    esEntrada: dto.amountUsdCents >= 0,
    description: text(dto.description),
    createdAt: dto.createdAt,
  }
}

export function toWalletTransactionPage(dto: WalletTransactionPageDto): Page<WalletTransaction> {
  return {
    items: dto.items.map(toWalletTransaction),
    page: dto.page,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
  }
}

export function toRechargeOptions(dto: RechargeOptionsDto): RechargeOptions {
  return {
    currency: dto.currency,
    symbol: dto.symbol,
    presets: dto.presets.map((p) => ({
      amount: p.amount,
      // Sin texto del servidor se compone con su símbolo y su cifra, en su misma moneda. Eso es dar
      // forma, no convertir: aquí no se aplica ningún tipo de cambio.
      formatted: text(p.formatted) ?? `${dto.symbol}${p.amount.toFixed(2)}`,
    })),
  }
}

export function toRecharge(dto: RechargeDto): Recharge {
  return {
    paymentId: dto.paymentId,
    status: dto.status,
    chargeFormatted: text(dto.chargeFormatted) ?? `$${(dto.amountUsdCents / 100).toFixed(2)}`,
    clientSecret: text(dto.clientSecret),
    approveUrl: text(dto.approveUrl),
  }
}
