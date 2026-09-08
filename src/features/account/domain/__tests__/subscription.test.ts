import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'

import { Plan, planNameOf, Subscription } from '../entities/subscription'
import { SubscriptionRepository } from '../ports/subscription-repository'
import { CancelSubscription, GetSubscription } from '../usecases/subscription'

const PLAN: Plan = {
  id: 'p-1',
  code: 'PRO',
  name: 'Profesional',
  monthlyFormatted: '29,00 €',
}

const SUSCRIPCION: Subscription = {
  planId: 'p-1',
  status: 'ACTIVE',
  billingPeriod: 'MONTHLY',
  currentPeriodEnd: '2026-10-01T00:00:00Z',
}

function repositorio(overrides: Partial<SubscriptionRepository> = {}): SubscriptionRepository {
  return {
    plans: jest.fn().mockResolvedValue(ok([PLAN])),
    current: jest.fn().mockResolvedValue(ok(SUSCRIPCION)),
    cancel: jest.fn().mockResolvedValue(ok(undefined)),
    ...overrides,
  }
}

describe('planNameOf', () => {
  it('resuelve el nombre del plan contratado', () => {
    expect(planNameOf(SUSCRIPCION, [PLAN])).toBe('Profesional')
  })

  /** Sin la lista se enseña el identificador: es feo, pero no miente sobre qué plan se tiene. */
  it('cae al identificador cuando el plan no está en la lista', () => {
    expect(planNameOf(SUSCRIPCION, [])).toBe('p-1')
  })
})

describe('GetSubscription', () => {
  it('devuelve la suscripción con el catálogo de planes', async () => {
    const result = await new GetSubscription(repositorio()).execute()

    expect(result.ok && result.value.subscription).toEqual(SUSCRIPCION)
    expect(result.ok && result.value.plans).toEqual([PLAN])
  })

  /**
   * Sin plan contratado el backend responde sin cuerpo. No es un fallo: es «esta cuenta no tiene
   * plan», y tratarlo como error pintaría un aviso rojo a todo el que nunca contrató nada.
   */
  it('trata «sin plan» como una respuesta válida', async () => {
    const result = await new GetSubscription(
      repositorio({ current: jest.fn().mockResolvedValue(ok(null)) }),
    ).execute()

    expect(result.ok && result.value.subscription).toBeNull()
  })

  /** Si la lista de planes falla, el estado del plan —que es lo que se viene a mirar— sigue estando. */
  it('aguanta que el catálogo de planes no llegue', async () => {
    const result = await new GetSubscription(
      repositorio({ plans: jest.fn().mockResolvedValue(err(new AppError('SERVER', 'caído'))) }),
    ).execute()

    expect(result.ok && result.value.subscription).toEqual(SUSCRIPCION)
    expect(result.ok && result.value.plans).toEqual([])
  })

  it('propaga el fallo si no se puede leer la suscripción', async () => {
    const result = await new GetSubscription(
      repositorio({ current: jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'sin red'))) }),
    ).execute()

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})

describe('CancelSubscription', () => {
  it('cancela', async () => {
    const cancel = jest.fn().mockResolvedValue(ok(undefined))

    const result = await new CancelSubscription(repositorio({ cancel })).execute()

    expect(result.ok).toBe(true)
    expect(cancel).toHaveBeenCalled()
  })
})
