import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { Plan, Subscription } from '../entities/subscription'
import { SubscriptionRepository } from '../ports/subscription-repository'

export interface SubscriptionState {
  readonly subscription: Subscription | null
  readonly plans: readonly Plan[]
}

/**
 * El plan contratado y el catálogo de planes, de una vez.
 *
 * <p>Las dos lecturas van juntas porque la suscripción solo trae el IDENTIFICADOR del plan: sin la
 * lista, la pantalla enseñaría un UUID donde debería poner «Profesional». Se piden en paralelo, y si
 * la lista falla la suscripción se devuelve igual —el nombre se degrada, pero el estado del plan, que
 * es lo que se ha venido a mirar, sigue estando—.
 */
export class GetSubscription {
  constructor(private readonly repository: SubscriptionRepository) {}

  async execute(): Promise<Result<SubscriptionState, AppError>> {
    const [actual, planes] = await Promise.all([this.repository.current(), this.repository.plans()])
    if (!actual.ok) return actual
    return {
      ok: true,
      value: { subscription: actual.value, plans: planes.ok ? planes.value : [] },
    }
  }
}

export class CancelSubscription {
  constructor(private readonly repository: SubscriptionRepository) {}

  execute(): Promise<Result<void, AppError>> {
    return this.repository.cancel()
  }
}
