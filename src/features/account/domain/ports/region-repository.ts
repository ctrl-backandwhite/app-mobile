import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { Currency, Language } from '../entities/region'

/**
 * Los idiomas y las divisas que la tienda ofrece HOY.
 *
 * <p>Se piden al servidor y no se escriben en la app a propósito: se administran desde el panel y una
 * lista fija aquí quedaría desfasada al activar la siguiente, obligando a publicar una versión nueva
 * en las tiendas de aplicaciones para añadir una moneda.
 */
export interface RegionRepository {
  languages(): Promise<Result<Language[], AppError>>
  currencies(): Promise<Result<Currency[], AppError>>
}
