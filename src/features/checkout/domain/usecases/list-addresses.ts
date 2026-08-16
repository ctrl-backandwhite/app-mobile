import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { Address } from '../entities/address'
import { AddressRepository } from '../ports/address-repository'

export class ListAddresses {
  constructor(private readonly addresses: AddressRepository) {}

  /** Las direcciones de la cuenta, con la predeterminada la primera para que se proponga sola. */
  async execute(): Promise<Result<Address[], AppError>> {
    const result = await this.addresses.list()
    if (!result.ok) return result
    return ok([...result.value].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)))
  }
}
