import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import {
  isValidRechargeAmount,
  RechargeMethod,
  RechargeOptions,
} from '../entities/wallet-recharge'
import { CardAuthenticator } from '../ports/card-authenticator'
import { PaymentApprovalGateway } from '../ports/payment-approval-gateway'
import { WalletRepository } from '../ports/wallet-repository'

export class GetRechargeOptions {
  constructor(private readonly wallet: WalletRepository) {}

  execute(currency: string): Promise<Result<RechargeOptions, AppError>> {
    return this.wallet.rechargeOptions(currency)
  }
}

export interface RechargeRequest {
  readonly method: RechargeMethod
  readonly amount: number
  readonly currency: string
}

/** Lo que ha pasado. `cancelled` no es un fallo: es alguien que ha decidido no pagar todavía. */
export type RechargeOutcome = 'recharged' | 'cancelled'

/**
 * Recargar el monedero.
 *
 * <p>El importe se manda en la divisa ACTIVA y es el backend quien deriva el dólar canónico y la
 * moneda de cobro: mandarlo ya convertido significaría dos tipos de cambio distintos —el del teléfono
 * y el del servidor— para un mismo cobro.
 *
 * <p>Los dos caminos acaban igual: el proveedor solo ACREDITA a la persona —el banco con su reto, o
 * PayPal con su aprobación—, y quien decide si el saldo sube es el backend al cerrar el cobro. Por eso
 * la confirmación contra el servidor no es opcional en ninguno de los dos.
 */
export class RechargeWallet {
  constructor(
    private readonly wallet: WalletRepository,
    private readonly cardAuthenticator: CardAuthenticator,
    private readonly approvalGateway: PaymentApprovalGateway,
  ) {}

  async execute(request: RechargeRequest): Promise<Result<RechargeOutcome, AppError>> {
    if (!isValidRechargeAmount(request.amount)) {
      return err(new AppError('VALIDATION', 'Escribe un importe mayor que cero.'))
    }

    const abierta = await this.wallet.startRecharge(request)
    if (!abierta.ok) return abierta
    const recarga = abierta.value

    if (recarga.clientSecret) {
      const reto = await this.cardAuthenticator.authenticate(recarga.clientSecret)
      if (!reto.ok) return reto
      const cierre = await this.wallet.confirmRecharge(recarga.paymentId)
      return cierre.ok ? ok('recharged') : cierre
    }

    if (recarga.approveUrl) {
      const aprobacion = await this.approvalGateway.approve(recarga.approveUrl)
      if (!aprobacion.ok) return aprobacion
      if (aprobacion.value === 'cancelled') return ok('cancelled')
      const cierre = await this.wallet.capturePayPal(recarga.paymentId)
      return cierre.ok ? ok('recharged') : cierre
    }

    // Sin secreto ni enlace no hay nada que aprobar. Dar la recarga por buena aquí sería anunciar un
    // saldo que nadie ha cobrado.
    return err(
      new AppError('SERVER', 'La pasarela no ha devuelto cómo continuar con el pago.'),
    )
  }
}
