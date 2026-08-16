import { AppError } from '@core/errors/app-error'
import { err, Result } from '@core/result/result'

import { Address, isCompleteAddress, NewAddress } from '../entities/address'
import { AddressRepository } from '../ports/address-repository'

const INCOMPLETE = new AppError(
  'VALIDATION',
  'Faltan datos: destinatario, dirección, ciudad y país (dos letras) son obligatorios.',
)

export class CreateAddress {
  constructor(private readonly addresses: AddressRepository) {}

  /**
   * Da de alta una dirección en la cuenta.
   *
   * Se comprueba antes de llamar porque el país incompleto es el error más habitual del formulario y
   * el backend responde a eso con un mensaje de validación genérico que no señala el campo.
   */
  async execute(address: NewAddress): Promise<Result<Address, AppError>> {
    if (!isCompleteAddress(address)) return err(INCOMPLETE)
    return this.addresses.create({ ...address, country: address.country.trim().toUpperCase() })
  }
}
