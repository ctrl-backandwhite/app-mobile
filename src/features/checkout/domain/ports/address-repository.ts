import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { Address, NewAddress } from '../entities/address'

/**
 * Libreta de direcciones de la cuenta. Vive en el backend, compartida con el panel web.
 *
 * Solo se lee y se añade: modificar o borrar una dirección desde la compra invitaría a tocar la que
 * ya está enviando otro pedido. Ese mantenimiento vive en el perfil.
 */
export interface AddressRepository {
  list(): Promise<Result<Address[], AppError>>
  create(address: NewAddress): Promise<Result<Address, AppError>>
}
