import { Page } from '@features/catalog/domain/entities/page'
import { WalletBalance } from '@features/checkout/domain/entities/wallet'
import {
  toWalletTransactionKind,
  WalletTransaction,
} from '@features/checkout/domain/entities/wallet-transaction'

import { WalletDto, WalletTransactionDto, WalletTransactionPageDto } from '../dto/checkout.dto'

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
