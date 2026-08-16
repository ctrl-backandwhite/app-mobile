import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { Address, NewAddress } from '../entities/address'
import { AddressRepository } from '../ports/address-repository'

interface Config {
  addresses?: Address[]
  error?: AppError
}

/** Libreta en memoria. Registra las altas para poder afirmar que algo NO se creó. */
export class FakeAddressRepository implements AddressRepository {
  created: NewAddress[] = []
  listCalls = 0

  constructor(private readonly config: Config = {}) {}

  async list(): Promise<Result<Address[], AppError>> {
    this.listCalls += 1
    if (this.config.error) return err(this.config.error)
    return ok([...(this.config.addresses ?? [])])
  }

  async create(address: NewAddress): Promise<Result<Address, AppError>> {
    this.created.push(address)
    if (this.config.error) return err(this.config.error)
    return ok({
      id: `a-${this.created.length}`,
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault ?? false,
    })
  }
}
