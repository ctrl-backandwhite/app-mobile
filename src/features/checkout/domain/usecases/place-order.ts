import { AppError } from '@core/errors/app-error'
import { err, Result } from '@core/result/result'

import { CheckoutDraft, CheckoutItem, missingRequirements } from '../entities/checkout-draft'
import { PlacedOrder } from '../entities/placed-order'
import { hasEnoughBalance, WalletBalance } from '../entities/wallet'
import { CHECKOUT_MESSAGES } from '../policies/checkout-errors'
import { CheckoutRepository } from '../ports/checkout-repository'

export interface PlaceOrderCommand {
  readonly draft: CheckoutDraft
  readonly items: readonly CheckoutItem[]
  /** Clave estable del intento. La calcula `checkoutIdempotencyKey` al abrir el resumen. */
  readonly idempotencyKey: string
  /** Saldo del monedero, si se conoce; solo se usa para frenar un pago que ya se sabe imposible. */
  readonly wallet?: WalletBalance
  /** Coste en céntimos USD con el que comparar ese saldo (subtotal de la cotización). */
  readonly requiredUsdCents?: number
}

export class PlaceOrder {
  constructor(private readonly checkout: CheckoutRepository) {}

  /**
   * Tramita el pedido.
   *
   * Las tres negativas de aquí no son adornos de la interfaz: son la última barrera antes de crear
   * algo que cuesta dinero. Un pedido sin dirección o sin método de pago nace pendiente y sin forma
   * de completarse, y un pago con monedero sin saldo deja un pedido a medias que alguien tendrá que
   * cancelar a mano. Mejor no llamar.
   */
  async execute(command: PlaceOrderCommand): Promise<Result<PlacedOrder, AppError>> {
    const { draft, items } = command

    const missing = missingRequirements(draft)
    if (missing.includes('address')) {
      return err(new AppError('VALIDATION', CHECKOUT_MESSAGES.noAddress))
    }
    if (missing.includes('payment')) {
      return err(new AppError('VALIDATION', CHECKOUT_MESSAGES.noPayment))
    }
    if (items.length === 0) {
      return err(new AppError('VALIDATION', CHECKOUT_MESSAGES.emptyCart))
    }

    const payment = draft.payment
    if (payment?.kind === 'WALLET' && !hasEnoughBalance(command.wallet, command.requiredUsdCents)) {
      return err(new AppError('VALIDATION', CHECKOUT_MESSAGES.insufficientWallet))
    }

    return this.checkout.placeOrder(
      {
        items,
        // `missingRequirements` ya ha garantizado que están; el operador solo satisface al compilador.
        shippingAddressId: draft.address?.id ?? '',
        paymentMethod: payment?.kind ?? 'WALLET',
        notes: draft.notes,
        couponCode: draft.couponCode,
      },
      command.idempotencyKey,
    )
  }
}
