import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { PaymentMethod } from '../entities/payment-method'
import {
  PaymentMethodsRepository,
  SavedCardCharge,
} from '../ports/payment-methods-repository'

interface Config {
  methods?: PaymentMethod[]
  charge?: SavedCardCharge
  chargeError?: AppError
  confirmError?: AppError
  listError?: AppError
}

export class FakePaymentMethodsRepository implements PaymentMethodsRepository {
  charges: { orderId: string; methodId: string }[] = []
  confirmations: { orderId: string; paymentId: string }[] = []

  constructor(private readonly config: Config = {}) {}

  async list(): Promise<Result<PaymentMethod[], AppError>> {
    if (this.config.listError) return err(this.config.listError)
    return ok([...(this.config.methods ?? [])])
  }

  async chargeSavedCard(
    orderId: string,
    paymentMethodId: string,
  ): Promise<Result<SavedCardCharge, AppError>> {
    this.charges.push({ orderId, methodId: paymentMethodId })
    if (this.config.chargeError) return err(this.config.chargeError)
    return ok(this.config.charge ?? { status: 'succeeded' })
  }

  async confirmSavedCard(orderId: string, paymentId: string): Promise<Result<void, AppError>> {
    this.confirmations.push({ orderId, paymentId })
    if (this.config.confirmError) return err(this.config.confirmError)
    return ok(undefined)
  }
}
