import { HttpWalletRepository } from '../repositories/http-wallet.repository'
import { makeClient } from '../testing/make-client'

const WALLET_OK = {
  id: 'w-1',
  balanceUsdCents: 12000,
  holdUsdCents: 2000,
  availableUsdCents: 10000,
  currencyDefault: 'USD',
  status: 'ACTIVE',
  balanceDisplay: 92.3,
  displayCurrency: 'EUR',
  displaySymbol: '€',
  balanceFormatted: '92,30 €',
}

describe('HttpWalletRepository', () => {
  it('devuelve el disponible en céntimos y el saldo ya formateado por el backend', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/wallet').reply(200, WALLET_OK)

    const result = await new HttpWalletRepository(client).balance()

    // Los céntimos solo sirven para comparar; lo que se pinta es el texto formateado.
    expect(result.ok && result.value.availableUsdCents).toBe(10000)
    expect(result.ok && result.value.balanceFormatted).toBe('92,30 €')
    expect(result.ok && result.value.currency).toBe('EUR')
  })

  it('tolera un monedero sin importe formateado', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/wallet').reply(200, { availableUsdCents: 0, status: 'ACTIVE' })

    const result = await new HttpWalletRepository(client).balance()

    expect(result.ok && result.value.balanceFormatted).toBeUndefined()
  })

  it('traduce un fallo de red a NETWORK', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/wallet').networkError()

    const result = await new HttpWalletRepository(client).balance()

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })

  it('falla con CONTRACT si el saldo no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/wallet').reply(200, { availableUsdCents: 'mucho' })

    const result = await new HttpWalletRepository(client).balance()

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })
})
