import { z } from 'zod'

import { AppError } from '@core/errors/app-error'
import { mapHttpError } from '@core/errors/http-error-mapper'
import { HttpClient } from '@core/http/http-client'
import { err, ok, Result } from '@core/result/result'
import {
  ExternalPaymentMethod,
  PaymentIntent,
  PaymentIntentRepository,
} from '@features/checkout/domain/ports/payment-intent-repository'

/**
 * La plataforma publica el enlace de aprobación como `approveUrl`; se acepta también `approvalUrl`
 * por si alguna respuesta usa esa forma, y así un cambio de nombre no deja el pago sin poder abrirse.
 */
const paymentIntentDto = z.object({
  id: z.string().nullable().optional(),
  paymentId: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  approveUrl: z.string().nullable().optional(),
  approvalUrl: z.string().nullable().optional(),
})

export class HttpPaymentIntentRepository implements PaymentIntentRepository {
  constructor(private readonly http: HttpClient) {}

  private parse(raw: unknown): PaymentIntent {
    const dto = paymentIntentDto.parse(raw)
    return {
      paymentId: dto.paymentId ?? dto.id ?? '',
      approvalUrl: dto.approveUrl ?? dto.approvalUrl ?? undefined,
      status: dto.status ?? 'PENDING',
    }
  }

  async initiate(
    orderId: string,
    method: ExternalPaymentMethod,
  ): Promise<Result<PaymentIntent, AppError>> {
    try {
      // La clave de idempotencia es estable por pedido y método: si la conexión se corta y se
      // reintenta, el backend devuelve el mismo intento en vez de abrir un cobro nuevo.
      const raw = await this.http.post(
        `/me/orders/${orderId}/payment-intent`,
        { method },
        { headers: { 'Idempotency-Key': `intent-${orderId}-${method}` } },
      )
      return ok(this.parse(raw))
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return err(new AppError('CONTRACT', 'La respuesta del pago no tiene el formato esperado.'))
      }
      return err(mapHttpError(error))
    }
  }

  async confirm(orderId: string, paymentId: string): Promise<Result<PaymentIntent, AppError>> {
    try {
      const raw = await this.http.post(`/me/orders/${orderId}/payments/${paymentId}/confirm`)
      return ok(this.parse(raw))
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return err(new AppError('CONTRACT', 'La respuesta del pago no tiene el formato esperado.'))
      }
      return err(mapHttpError(error))
    }
  }
}
