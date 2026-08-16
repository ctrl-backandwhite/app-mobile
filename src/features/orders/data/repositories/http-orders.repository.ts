import { AppError } from '@core/errors/app-error'
import { mapHttpError } from '@core/errors/http-error-mapper'
import { HttpClient } from '@core/http/http-client'
import { err, ok, Result } from '@core/result/result'
import { Order } from '@features/orders/domain/entities/order'
import { OrderDetail } from '@features/orders/domain/entities/order-detail'
import { OrderTracking } from '@features/orders/domain/entities/tracking'
import { OrdersRepository } from '@features/orders/domain/ports/orders-repository'

import { orderDetailDto, orderListDto, trackingDto } from '../dto/orders.dto'
import { toOrder, toOrderDetail } from '../mappers/order.mapper'
import { toOrderTracking } from '../mappers/tracking.mapper'

/** Zod señala sus fallos con este nombre; comprobarlo evita acoplarse a la clase concreta. */
function isSchemaViolation(error: unknown): boolean {
  return error instanceof Error && error.name === 'ZodError'
}

export class HttpOrdersRepository implements OrdersRepository {
  constructor(private readonly http: HttpClient) {}

  /**
   * Envuelve una llamada al backend: traduce cualquier fallo a `AppError` y valida el contrato.
   * Una respuesta que no cumple el esquema se convierte en un error `CONTRACT` explícito en lugar
   * de un valor incompleto que reventaría más adelante.
   */
  private async call<T>(
    operation: () => Promise<unknown>,
    parse: (raw: unknown) => T,
  ): Promise<Result<T, AppError>> {
    try {
      return ok(parse(await operation()))
    } catch (error) {
      if (isSchemaViolation(error)) {
        return err(new AppError('CONTRACT', 'La respuesta del servidor no tiene el formato esperado.'))
      }
      return err(mapHttpError(error))
    }
  }

  async list(): Promise<Result<Order[], AppError>> {
    return this.call(
      () => this.http.get('/me/orders'),
      (raw) => orderListDto.parse(raw).map(toOrder),
    )
  }

  async detail(id: string, lang: string): Promise<Result<OrderDetail, AppError>> {
    return this.call(
      // El idioma viaja aparte porque el título del producto se guardó en chino al comprar: sin él
      // el detalle enseñaría el nombre del proveedor en lugar del traducido.
      () => this.http.get(`/me/orders/${encodeURIComponent(id)}`, { params: { lang } }),
      (raw) => toOrderDetail(orderDetailDto.parse(raw)),
    )
  }

  async tracking(id: string): Promise<Result<OrderTracking, AppError>> {
    return this.call(
      () => this.http.get(`/me/orders/${encodeURIComponent(id)}/tracking`),
      (raw) => toOrderTracking(trackingDto.parse(raw)),
    )
  }

  async cancel(
    id: string,
    lang: string,
    refundToWallet: boolean,
  ): Promise<Result<OrderDetail, AppError>> {
    return this.call(
      // Sin cuerpo: el backend espera los dos datos como parámetros de consulta.
      () =>
        this.http.post(`/me/orders/${encodeURIComponent(id)}/cancel`, null, {
          params: { lang, refundToWallet },
        }),
      (raw) => toOrderDetail(orderDetailDto.parse(raw)),
    )
  }
}
