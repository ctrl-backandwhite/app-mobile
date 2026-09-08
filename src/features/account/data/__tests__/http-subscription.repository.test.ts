import MockAdapter from 'axios-mock-adapter'

import { HttpClient } from '@core/http/http-client'

import { HttpSubscriptionRepository } from '../repositories/http-subscription.repository'

function makeClient(): { client: HttpClient; mock: MockAdapter } {
  const client = new HttpClient('https://api.test', {
    getAccessToken: () => null,
    getRefreshToken: () => null,
    onRefreshed: () => undefined,
    onExpired: () => undefined,
    getCountry: () => null,
    getLocale: () => 'es',
    getCurrency: () => 'EUR',
  })
  return { client, mock: new MockAdapter(client.raw) }
}

describe('HttpSubscriptionRepository · planes', () => {
  it('traduce la lista con los precios que formatea el servidor', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/billing/plans').reply(200, [
      {
        id: 'p-1',
        code: 'PRO',
        name: 'Profesional',
        description: 'Para quien ya vende',
        displayMonthlyFormatted: '29,00 €',
        displayYearlyFormatted: '290,00 €',
        priceMonthlyCents: 2900,
        position: 2,
      },
    ])

    const result = await new HttpSubscriptionRepository(client).plans()

    expect(result.ok && result.value).toEqual([
      {
        id: 'p-1',
        code: 'PRO',
        name: 'Profesional',
        description: 'Para quien ya vende',
        monthlyFormatted: '29,00 €',
        yearlyFormatted: '290,00 €',
      },
    ])
  })

  it('falla con CONTRACT si un plan viene sin identificador', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/billing/plans').reply(200, [{ name: 'Sin id' }])

    const result = await new HttpSubscriptionRepository(client).plans()

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })
})

describe('HttpSubscriptionRepository · suscripción', () => {
  it('traduce la suscripción vigente', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/subscription').reply(200, {
      planId: 'p-1',
      status: 'ACTIVE',
      billingPeriod: 'MONTHLY',
      currentPeriodEnd: '2026-10-01T00:00:00Z',
      cancelAt: null,
    })

    const result = await new HttpSubscriptionRepository(client).current()

    expect(result.ok && result.value).toEqual({
      planId: 'p-1',
      status: 'ACTIVE',
      billingPeriod: 'MONTHLY',
      currentPeriodEnd: '2026-10-01T00:00:00Z',
      cancelAt: undefined,
    })
  })

  /**
   * Sin plan el backend responde 204 y el cuerpo llega vacío. Tratarlo como fallo pintaría un aviso
   * rojo a todo el que nunca contrató nada.
   */
  it('devuelve nada, y no un error, cuando la cuenta no tiene plan', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/subscription').reply(204)

    const result = await new HttpSubscriptionRepository(client).current()

    expect(result.ok && result.value).toBeNull()
  })

  it('cancela', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/subscription/cancel').reply(204)

    const result = await new HttpSubscriptionRepository(client).cancel()

    expect(result.ok).toBe(true)
  })

  it('traduce un fallo de red al cancelar', async () => {
    const { client, mock } = makeClient()
    mock.onPost('/me/subscription/cancel').networkError()

    const result = await new HttpSubscriptionRepository(client).cancel()

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})
