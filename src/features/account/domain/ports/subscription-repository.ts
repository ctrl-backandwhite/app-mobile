import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { Plan, Subscription } from '../entities/subscription'

export interface SubscriptionRepository {
  plans(): Promise<Result<Plan[], AppError>>
  /** `null` cuando la cuenta no tiene plan: es una respuesta válida, no un fallo. */
  current(): Promise<Result<Subscription | null, AppError>>
  cancel(): Promise<Result<void, AppError>>
}
