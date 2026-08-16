import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { BillingConfig } from '../entities/billing-config'

export interface BillingRepository {
  /** Ajustes públicos del cobro con tarjeta, la clave de la pasarela incluida. */
  config(): Promise<Result<BillingConfig, AppError>>
  /**
   * Abre un intento de GUARDADO de tarjeta y devuelve el secreto con el que se cierra.
   *
   * Los datos de la tarjeta no pasan por el backend en ningún momento: viajan del dispositivo a la
   * pasarela, y el backend solo se queda con la referencia opaca del método guardado.
   */
  createSetupIntent(): Promise<Result<string, AppError>>
}
