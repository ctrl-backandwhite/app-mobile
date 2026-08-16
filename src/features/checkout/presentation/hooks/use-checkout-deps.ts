import { useContainer } from '@composition/container.provider'
import { CreateAddress } from '@features/checkout/domain/usecases/create-address'
import { GetWalletBalance } from '@features/checkout/domain/usecases/get-wallet-balance'
import { ListAddresses } from '@features/checkout/domain/usecases/list-addresses'
import { ListPaymentMethods } from '@features/checkout/domain/usecases/list-payment-methods'
import { ListRegions } from '@features/checkout/domain/usecases/list-regions'
import { PayWithSavedCard } from '@features/checkout/domain/usecases/pay-with-saved-card'
import { PlaceOrder } from '@features/checkout/domain/usecases/place-order'
import { QuoteShipping } from '@features/checkout/domain/usecases/quote-shipping'

/** Casos de uso que necesitan las pantallas de la compra. */
export interface CheckoutDeps {
  readonly listAddresses: ListAddresses
  readonly createAddress: CreateAddress
  readonly listRegions: ListRegions
  readonly quoteShipping: QuoteShipping
  readonly placeOrder: PlaceOrder
  readonly getWalletBalance: GetWalletBalance
  readonly listPaymentMethods: ListPaymentMethods
  readonly payWithSavedCard: PayWithSavedCard
}

/** Casos de uso de la compra tomados del contenedor de la aplicación. */
export function useCheckoutDeps(): CheckoutDeps {
  return useContainer()
}
