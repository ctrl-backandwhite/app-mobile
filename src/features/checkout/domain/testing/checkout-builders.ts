/**
 * Constructores de datos para las pruebas de la compra.
 *
 * Viven fuera de `__tests__` porque el `testMatch` de jest-expo trata como suite cualquier fichero
 * bajo esa carpeta, y un módulo sin `it` rompe la ejecución.
 */
import { Address } from '../entities/address'
import { CheckoutDraft, CheckoutItem } from '../entities/checkout-draft'
import { PaymentMethod } from '../entities/payment-method'
import { PlacedOrder } from '../entities/placed-order'
import { ShippingQuote } from '../entities/shipping'
import { WalletBalance } from '../entities/wallet'

export function anAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: 'a-1',
    label: 'Casa',
    fullName: 'Ana Ruiz',
    phone: '+34600111222',
    line1: 'Calle Mayor 1',
    city: 'Madrid',
    postalCode: '28013',
    country: 'ES',
    isDefault: true,
    ...overrides,
  }
}

export function aCheckoutItem(overrides: Partial<CheckoutItem> = {}): CheckoutItem {
  return { productId: 'p-1', quantity: 2, ...overrides }
}

export function aShippingQuote(overrides: Partial<ShippingQuote> = {}): ShippingQuote {
  return {
    supported: true,
    countryCode: 'ES',
    carrier: 'YunExpress',
    serviceName: 'BPA',
    etaMinDays: 7,
    etaMaxDays: 15,
    taxRateBps: 2100,
    subtotalUsdCents: 2580,
    customsHandlingUsdCents: 0,
    discountCents: 0,
    subtotalFormatted: '25,80 €',
    shippingFormatted: '4,20 €',
    shippingBaseFormatted: '4,20 €',
    taxFormatted: '6,30 €',
    totalFormatted: '36,30 €',
    customsThresholdExceeded: false,
    customsBlocked: false,
    taxMode: 'DDP',
    ...overrides,
  }
}

export function aPaymentMethod(overrides: Partial<PaymentMethod> = {}): PaymentMethod {
  return { id: 'pm_1', type: 'CARD', brand: 'visa', last4: '4242', isDefault: true, ...overrides }
}

export function aWalletBalance(overrides: Partial<WalletBalance> = {}): WalletBalance {
  return {
    availableUsdCents: 10000,
    balanceFormatted: '100,00 €',
    currency: 'EUR',
    status: 'ACTIVE',
    ...overrides,
  }
}

export function aPlacedOrder(overrides: Partial<PlacedOrder> = {}): PlacedOrder {
  return {
    id: 'o-1',
    orderNumber: 'NX-1001',
    status: 'PAID',
    paymentMethod: 'WALLET',
    totalFormatted: '36,30 €',
    ...overrides,
  }
}

export function aDraft(overrides: Partial<CheckoutDraft> = {}): CheckoutDraft {
  return { address: anAddress(), payment: { kind: 'WALLET' }, ...overrides }
}
