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

describe('HttpWalletRepository · movimientos', () => {
  const APUNTE = {
    id: 't-1',
    kind: 'PAYMENT',
    amountUsdCents: -4500,
    balanceAfterCents: 7500,
    description: 'Pedido NX-2026-0001',
    createdAt: '2026-09-01T10:00:00Z',
    amountFormatted: '-$45.00',
    balanceAfterFormatted: '$75.00',
  }

  it('pide la página al backend y traduce los apuntes', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/wallet/transactions').reply(200, {
      items: [APUNTE],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    })

    const result = await new HttpWalletRepository(client).transactions(0, 20)

    expect(result.ok && result.value.items).toEqual([
      {
        id: 't-1',
        kind: 'PAYMENT',
        amountFormatted: '-$45.00',
        balanceAfterFormatted: '$75.00',
        esEntrada: false,
        description: 'Pedido NX-2026-0001',
        createdAt: '2026-09-01T10:00:00Z',
      },
    ])
  })

  it('manda la página y el tamaño como parámetros', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/wallet/transactions').reply(200, { items: [] })

    await new HttpWalletRepository(client).transactions(3, 20)

    expect(mock.history.get[0]?.params).toEqual({ page: 3, size: 20 })
  })

  /**
   * Sin las cadenas del backend se escribe la cifra en DÓLARES, que es la unidad en la que llegan los
   * céntimos. Aquí no se convierte nada: dar forma no es calcular un tipo de cambio.
   */
  it('escribe el importe en dólares si el backend no lo formatea', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/wallet/transactions').reply(200, {
      items: [{ id: 't-2', kind: 'DEPOSIT', amountUsdCents: 2500, balanceAfterCents: 2500 }],
    })

    const result = await new HttpWalletRepository(client).transactions(0, 20)

    expect(result.ok && result.value.items.map((m) => m.amountFormatted)).toEqual(['+$25.00'])
    expect(result.ok && result.value.items.map((m) => m.balanceAfterFormatted)).toEqual(['$25.00'])
  })

  it('marca como salida lo que resta', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/wallet/transactions').reply(200, {
      items: [{ id: 't-3', kind: 'PAYMENT', amountUsdCents: -100, balanceAfterCents: 0 }],
    })

    const result = await new HttpWalletRepository(client).transactions(0, 20)

    expect(result.ok && result.value.items.map((m) => m.esEntrada)).toEqual([false])
    expect(result.ok && result.value.items.map((m) => m.amountFormatted)).toEqual(['-$1.00'])
  })

  it('traduce un fallo de red a NETWORK', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/wallet/transactions').networkError()

    const result = await new HttpWalletRepository(client).transactions(0, 20)

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })

  it('falla con CONTRACT si la página no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/wallet/transactions').reply(200, { items: [{ kind: 'DEPOSIT' }] })

    const result = await new HttpWalletRepository(client).transactions(0, 20)

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })
})

describe('HttpWalletRepository · recarga', () => {
  it('pide los importes sugeridos en la divisa activa', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/wallet/recharge/options').reply(200, {
      currency: 'EUR',
      symbol: '€',
      presets: [{ amount: 25, formatted: '25,00 €' }],
    })

    const result = await new HttpWalletRepository(client).rechargeOptions('EUR')

    expect(mock.history.get[0]?.params).toEqual({ currency: 'EUR' })
    expect(result.ok && result.value.presets).toEqual([{ amount: 25, formatted: '25,00 €' }])
  })

  /** Sin texto del servidor se compone con su símbolo y su cifra: dar forma no es convertir. */
  it('compone el texto del importe si el backend no lo manda', async () => {
    const { client, mock } = makeClient()
    mock
      .onGet('/me/wallet/recharge/options')
      .reply(200, { currency: 'EUR', symbol: '€', presets: [{ amount: 50 }] })

    const result = await new HttpWalletRepository(client).rechargeOptions('EUR')

    expect(result.ok && result.value.presets.map((p) => p.formatted)).toEqual(['€50.00'])
  })

  /**
   * El importe viaja en la divisa ACTIVA. Mandarlo ya convertido significaría dos tipos de cambio
   * distintos —el del teléfono y el del servidor— para un mismo cobro.
   */
  it('abre la recarga con el importe en la divisa activa', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/wallet/recharge').reply(200, {
      paymentId: 'p-1',
      status: 'PENDING',
      amountUsdCents: 2700,
      chargeFormatted: '25,00 €',
      clientSecret: 'secreto',
    })

    const result = await new HttpWalletRepository(client).startRecharge({
      method: 'CARD',
      amount: 25,
      currency: 'EUR',
    })

    expect(JSON.parse(mock.history.post[0]?.data ?? '{}')).toEqual({
      method: 'CARD',
      currencyDisplay: 'EUR',
      amountDisplay: 25,
    })
    expect(result.ok && result.value.clientSecret).toBe('secreto')
    expect(result.ok && result.value.chargeFormatted).toBe('25,00 €')
  })

  it('escribe el cargo en dólares si el backend no lo formatea', async () => {
    const { client, mock } = makeClient()
    mock
      .onPost('/me/wallet/recharge')
      .reply(200, { paymentId: 'p-1', status: 'PENDING', amountUsdCents: 2700 })

    const result = await new HttpWalletRepository(client).startRecharge({
      method: 'CARD',
      amount: 25,
      currency: 'EUR',
    })

    expect(result.ok && result.value.chargeFormatted).toBe('$27.00')
  })

  it('cierra el cobro de la tarjeta', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/wallet/recharge/p-1/confirm').reply(200, {})

    const result = await new HttpWalletRepository(client).confirmRecharge('p-1')

    expect(result.ok).toBe(true)
  })

  it('captura el cobro de PayPal con el identificador como parámetro', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/wallet/paypal/capture').reply(200, {})

    const result = await new HttpWalletRepository(client).capturePayPal('p-2')

    expect(result.ok).toBe(true)
    expect(mock.history.post[0]?.params).toEqual({ paymentId: 'p-2' })
  })

  it('falla con CONTRACT si la recarga viene sin identificador de pago', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/wallet/recharge').reply(200, { status: 'PENDING' })

    const result = await new HttpWalletRepository(client).startRecharge({
      method: 'CARD',
      amount: 25,
      currency: 'EUR',
    })

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })
})
