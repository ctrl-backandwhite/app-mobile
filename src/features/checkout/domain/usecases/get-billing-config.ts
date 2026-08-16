import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { BillingConfig } from '../entities/billing-config'
import { BillingRepository } from '../ports/billing-repository'

export class GetBillingConfig {
  constructor(private readonly billing: BillingRepository) {}

  /** Ajustes con los que arrancar la pasarela, la clave pública incluida. */
  async execute(): Promise<Result<BillingConfig, AppError>> {
    return this.billing.config()
  }
}
