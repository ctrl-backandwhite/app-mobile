import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { defaultPaymentMethod, PaymentMethod } from '../entities/payment-method'
import { PaymentMethodsRepository } from '../ports/payment-methods-repository'

export class ListPaymentMethods {
  constructor(private readonly methods: PaymentMethodsRepository) {}

  /** Métodos guardados en el perfil, con el predeterminado el primero para poder preseleccionarlo. */
  async execute(): Promise<Result<PaymentMethod[], AppError>> {
    const result = await this.methods.list()
    if (!result.ok) return result

    const preferred = defaultPaymentMethod(result.value)
    if (!preferred) return ok([])
    return ok([preferred, ...result.value.filter((method) => method.id !== preferred.id)])
  }
}
