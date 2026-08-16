import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { Region } from '../entities/shipping'
import { ShippingRepository } from '../ports/shipping-repository'

export class ListRegions {
  constructor(private readonly shipping: ShippingRepository) {}

  /**
   * Estados o provincias del país. La lista vacía es una respuesta legítima: la mayoría de países no
   * tienen regiones curadas y entonces el formulario acepta el texto libre.
   */
  async execute(country: string): Promise<Result<Region[], AppError>> {
    const code = country.trim()
    if (code.length !== 2) return ok([])
    return this.shipping.regions(code.toUpperCase())
  }
}
