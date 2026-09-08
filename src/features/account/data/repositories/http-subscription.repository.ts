import { AppError } from '@core/errors/app-error'
import { call } from '@core/http/call'
import { HttpClient } from '@core/http/http-client'
import { Result } from '@core/result/result'
import { Plan, Subscription } from '@features/account/domain/entities/subscription'
import { SubscriptionRepository } from '@features/account/domain/ports/subscription-repository'

import { PlanDto, plansDto, SubscriptionDto, subscriptionDto } from '../dto/subscription.dto'

function toPlan(dto: PlanDto): Plan {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description ?? undefined,
    monthlyFormatted: dto.displayMonthlyFormatted ?? undefined,
    yearlyFormatted: dto.displayYearlyFormatted ?? undefined,
  }
}

function toSubscription(dto: SubscriptionDto): Subscription {
  return {
    planId: dto.planId,
    status: dto.status,
    billingPeriod: dto.billingPeriod,
    currentPeriodEnd: dto.currentPeriodEnd ?? undefined,
    cancelAt: dto.cancelAt ?? undefined,
  }
}

export class HttpSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly http: HttpClient) {}

  async plans(): Promise<Result<Plan[], AppError>> {
    return call(
      () => this.http.get('/billing/plans'),
      (raw) => plansDto.parse(raw ?? []).map(toPlan),
      'La lista de planes no tiene el formato esperado.',
    )
  }

  /**
   * Sin suscripción el backend responde 204 y el cuerpo llega vacío. No es un error: es «esta cuenta
   * no tiene plan», y tratarlo como fallo pintaría un aviso rojo a todo el que nunca contrató nada.
   */
  async current(): Promise<Result<Subscription | null, AppError>> {
    return call(
      () => this.http.get('/me/subscription'),
      (raw) => (raw ? toSubscription(subscriptionDto.parse(raw)) : null),
      'La suscripción no tiene el formato esperado.',
    )
  }

  async cancel(): Promise<Result<void, AppError>> {
    return call(
      () => this.http.post('/me/subscription/cancel'),
      () => undefined,
    )
  }
}
