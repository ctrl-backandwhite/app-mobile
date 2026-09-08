import { AppError } from '@core/errors/app-error'
import { call } from '@core/http/call'
import { HttpClient } from '@core/http/http-client'
import { Result } from '@core/result/result'
import { Address, NewAddress } from '@features/checkout/domain/entities/address'
import { AddressRepository } from '@features/checkout/domain/ports/address-repository'

import { addressDto, addressListDto } from '../dto/checkout.dto'
import { toAddress, toAddressPayload } from '../mappers/address.mapper'

const CONTRACT = 'La libreta de direcciones del servidor no tiene el formato esperado.'

export class HttpAddressRepository implements AddressRepository {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<Result<Address[], AppError>> {
    return call(
      () => this.http.get('/me/addresses'),
      (raw) => addressListDto.parse(raw).map(toAddress),
      CONTRACT,
    )
  }

  async create(address: NewAddress): Promise<Result<Address, AppError>> {
    return call(
      () => this.http.post('/me/addresses', toAddressPayload(address)),
      (raw) => toAddress(addressDto.parse(raw)),
      CONTRACT,
    )
  }
}
