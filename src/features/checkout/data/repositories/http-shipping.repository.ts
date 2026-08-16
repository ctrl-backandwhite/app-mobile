import { AppError } from '@core/errors/app-error'
import { HttpClient } from '@core/http/http-client'
import { Result } from '@core/result/result'
import { Region, ShippingQuote } from '@features/checkout/domain/entities/shipping'
import { ShippingQuoteQuery, ShippingRepository } from '@features/checkout/domain/ports/shipping-repository'

import { regionListDto, shippingQuoteDto } from '../dto/checkout.dto'
import { toShippingQuote } from '../mappers/shipping.mapper'

import { call } from './http-call'

const CONTRACT = 'La cotización de envío del servidor no tiene el formato esperado.'

export class HttpShippingRepository implements ShippingRepository {
  constructor(private readonly http: HttpClient) {}

  /**
   * Portes, impuestos y total del destino.
   *
   * La divisa en la que vuelven los importes formateados la fija el interceptor con `X-Currency`;
   * aquí no se elige ni se convierte nada.
   */
  async quote(query: ShippingQuoteQuery): Promise<Result<ShippingQuote, AppError>> {
    return call(
      () =>
        this.http.post('/shipping/quote', {
          country: query.country,
          region: query.region,
          items: query.items,
          couponCode: query.couponCode,
        }),
      (raw) => toShippingQuote(shippingQuoteDto.parse(raw)),
      CONTRACT,
    )
  }

  async regions(country: string): Promise<Result<Region[], AppError>> {
    return call(
      () => this.http.get('/shipping/regions', { params: { country } }),
      (raw) => regionListDto.parse(raw).map((region) => ({ code: region.code, name: region.name })),
      CONTRACT,
    )
  }
}
