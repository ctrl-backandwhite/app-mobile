import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import { Page } from '@features/catalog/domain/entities/page'

import { WalletTransaction } from '../entities/wallet-transaction'
import { WalletRepository } from '../ports/wallet-repository'
import { ListWalletTransactions, WALLET_PAGE_SIZE } from '../usecases/list-wallet-transactions'

const VACIA: Page<WalletTransaction> = {
  items: [],
  page: 0,
  size: WALLET_PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
}

function repositorio(transactions = jest.fn().mockResolvedValue(ok(VACIA))): {
  repo: WalletRepository
  transactions: jest.Mock
} {
  return {
    repo: { balance: jest.fn(), transactions } as unknown as WalletRepository,
    transactions,
  }
}

describe('ListWalletTransactions', () => {
  it('pide la página con el tamaño acordado', async () => {
    const { repo, transactions } = repositorio()

    await new ListWalletTransactions(repo).execute(2)

    expect(transactions).toHaveBeenCalledWith(2, WALLET_PAGE_SIZE)
  })

  /** Una página negativa saldría del backend como un 400 y dejaría el histórico en blanco. */
  it('nunca pide una página negativa', async () => {
    const { repo, transactions } = repositorio()

    await new ListWalletTransactions(repo).execute(-3)

    expect(transactions).toHaveBeenCalledWith(0, WALLET_PAGE_SIZE)
  })

  it('propaga el fallo', async () => {
    const { repo } = repositorio(
      jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'sin conexión'))),
    )

    const result = await new ListWalletTransactions(repo).execute(0)

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})
