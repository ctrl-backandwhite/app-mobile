import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { SupportedCountry } from '../entities/shipping'
import { ShippingRepository } from '../ports/shipping-repository'

export class ListCountries {
  constructor(private readonly shipping: ShippingRepository) {}

  /**
   * Los destinos a los que se puede enviar de verdad.
   *
   * El orden y el idioma de los nombres los decide el servidor: ordenar aquí daría una secuencia
   * distinta a la del escritorio, y traducir aquí exigiría mantener una segunda tabla de países.
   */
  async execute(): Promise<Result<SupportedCountry[], AppError>> {
    return this.shipping.countries()
  }
}
