import { AppError } from '@core/errors/app-error'
import { call } from '@core/http/call'
import { HttpClient } from '@core/http/http-client'
import { Result } from '@core/result/result'
import { BillingConfig } from '@features/checkout/domain/entities/billing-config'
import { BillingRepository } from '@features/checkout/domain/ports/billing-repository'

import { billingConfigDto, setupIntentDto } from '../dto/checkout.dto'
import { toBillingConfig } from '../mappers/billing.mapper'

const CONTRACT = 'La respuesta de la configuración de pago no tiene el formato esperado.'

export class HttpBillingRepository implements BillingRepository {
  constructor(private readonly http: HttpClient) {}

  async config(): Promise<Result<BillingConfig, AppError>> {
    return call(
      () => this.http.get('/me/billing/config'),
      (raw) => toBillingConfig(billingConfigDto.parse(raw)),
      CONTRACT,
    )
  }

  /**
   * Sin cuerpo ni clave de idempotencia, igual que en el panel web: cada apertura del formulario
   * abre su propio intento, y un intento de guardado que se queda sin usar no cobra ni retiene nada.
   */
  async createSetupIntent(): Promise<Result<string, AppError>> {
    return call(
      () => this.http.post('/me/payment-methods/setup-intent'),
      (raw) => setupIntentDto.parse(raw).clientSecret,
      CONTRACT,
    )
  }
}
