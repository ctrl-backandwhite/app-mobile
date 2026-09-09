import { z } from 'zod'

/*
 * LO QUE FALTA VIAJA DE DOS FORMAS y hay que admitir las dos: el backend a veces omite el campo y a
 * veces lo manda como `null` explícito. `optional()` acepta lo primero pero NO lo segundo, y con un
 * solo nulo la validación entera se cae: la portada de la aplicación decía «No se ha podido cargar el
 * catálogo» porque un producto sin rebaja llegaba con `originalFormatted: null`.
 *
 * Por eso `nullish()` en todo lo que el servidor puede dejar vacío. Los mapeadores traducen ese nulo
 * a ausencia, que es lo único que entiende el dominio.
 */

/**
 * Contratos de la compra, validados en la frontera.
 *
 * TOLERANTES a propósito: el backend sirve estas mismas respuestas al panel web, con campos que aquí
 * no interesan —importes en crudo, marcas de tiempo, direcciones de facturación—, y añade otros con
 * el tiempo. `z.object` descarta lo que no conoce y los valores por omisión cubren lo que un
 * despliegue antiguo todavía no manda, así que una versión distinta del servidor no rompe la app.
 *
 * De los importes solo se recoge lo YA FORMATEADO. Los números en crudo que se conservan son
 * céntimos de dólar que sirven para decidir (si hay línea de aduana, si el monedero llega), nunca
 * para componer un importe en pantalla.
 */
export const addressDto = z.object({
  id: z.string(),
  label: z.string().nullish(),
  fullName: z.string().default(''),
  phone: z.string().nullish(),
  line1: z.string().default(''),
  line2: z.string().nullish(),
  city: z.string().default(''),
  state: z.string().nullish(),
  postalCode: z.string().nullish(),
  country: z.string().default(''),
  // El backend la llama `default`, que en JavaScript no es palabra reservada como clave.
  default: z.boolean().default(false),
})

export const addressListDto = z.array(addressDto)

export const shippingQuoteDto = z.object({
  supported: z.boolean().default(false),
  countryCode: z.string().nullish(),
  carrier: z.string().nullish(),
  serviceName: z.string().nullish(),
  etaMinDays: z.number().default(0),
  etaMaxDays: z.number().default(0),
  taxRateBps: z.number().default(0),
  subtotalUsdCents: z.number().default(0),
  customsHandlingUsdCents: z.number().default(0),
  discountCents: z.number().default(0),
  subtotalFormatted: z.string().nullish(),
  shippingFormatted: z.string().nullish(),
  shippingBaseFormatted: z.string().nullish(),
  customsHandlingFormatted: z.string().nullish(),
  taxFormatted: z.string().nullish(),
  totalFormatted: z.string().nullish(),
  discountFormatted: z.string().nullish(),
  customsThresholdExceeded: z.boolean().default(false),
  customsBlocked: z.boolean().default(false),
  customsLimit: z.string().nullish(),
  taxMode: z.string().nullish(),
  couponCode: z.string().nullish(),
  couponError: z.string().nullish(),
})

export const regionListDto = z.array(z.object({ code: z.string(), name: z.string().default('') }))

/**
 * Pedido recién creado.
 *
 * `approveUrl` es el nombre con el que la plataforma publica el enlace de aprobación de la pasarela
 * en OTRA respuesta; se acepta aquí por si algún día la tramitación lo devuelve, junto al nombre
 * alternativo `approvalUrl`. Hoy no llega ninguno de los dos.
 */
export const placedOrderDto = z.object({
  id: z.string(),
  orderNumber: z.string().default(''),
  status: z.string().default(''),
  paymentMethod: z.string().nullish(),
  totalFormatted: z.string().nullish(),
  approveUrl: z.string().nullish(),
  approvalUrl: z.string().nullish(),
})

export const walletDto = z.object({
  availableUsdCents: z.number().default(0),
  balanceFormatted: z.string().nullish(),
  displayCurrency: z.string().default(''),
  status: z.string().default(''),
  // Lo retenido por operaciones en curso. Solo se enseña si de verdad hay algo retenido: un
  // «Retenido: 0,00 $» inquieta sin motivo, y hay monederos con una retención huérfana de los
  // primeros días de la plataforma.
  holdUsdCents: z.number().nullish(),
  holdUsdFormatted: z.string().nullish(),
})

/**
 * Un apunte. `kind` se valida como texto libre y lo normaliza el dominio: con un `enum` estricto,
 * una clase nueva en el servidor tumbaría el histórico entero y dejaría sin ver los apuntes que la
 * app sí sabe pintar.
 */
export const walletTransactionDto = z.object({
  id: z.string(),
  kind: z.string().default(''),
  amountUsdCents: z.number().default(0),
  balanceAfterCents: z.number().default(0),
  description: z.string().nullish(),
  createdAt: z.string().default(''),
  amountFormatted: z.string().nullish(),
  balanceAfterFormatted: z.string().nullish(),
})

export const rechargeOptionsDto = z.object({
  currency: z.string().default(''),
  symbol: z.string().default(''),
  presets: z
    .array(z.object({ amount: z.number(), formatted: z.string().nullish() }))
    .default([]),
})

/**
 * La recarga abierta. `clientSecret` y `approveUrl` llegan según el método, nunca los dos: el primero
 * es de la tarjeta y el segundo de PayPal.
 */
export const rechargeDto = z.object({
  paymentId: z.string(),
  status: z.string().default(''),
  amountUsdCents: z.number().default(0),
  chargeFormatted: z.string().nullish(),
  clientSecret: z.string().nullish(),
  approveUrl: z.string().nullish(),
})

export const walletTransactionPageDto = z.object({
  items: z.array(walletTransactionDto).default([]),
  page: z.number().default(0),
  size: z.number().default(0),
  totalElements: z.number().default(0),
  totalPages: z.number().default(0),
})

/**
 * Método de pago guardado. `type` se valida como texto libre y es el mapeador quien descarta los
 * que la app no sabe pintar: con un `enum` estricto, un tipo nuevo en el servidor tumbaría la lista
 * entera y dejaría a la persona sin poder pagar con los que sí conoce.
 */
export const paymentMethodDto = z.object({
  id: z.string(),
  type: z.string().default(''),
  brand: z.string().nullish(),
  last4: z.string().nullish(),
  expMonth: z.number().nullish(),
  expYear: z.number().nullish(),
  paypalEmail: z.string().nullish(),
  isDefault: z.boolean().default(false),
})

export const paymentMethodListDto = z.array(paymentMethodDto)

export const savedCardChargeDto = z.object({
  status: z.string().default(''),
  clientSecret: z.string().nullish(),
  paymentId: z.string().nullish(),
})

/**
 * Ajustes del cobro con tarjeta.
 *
 * `enabled` cae a falso cuando la respuesta no lo dice: ante la duda, mejor no ofrecer un formulario
 * de tarjeta que después no va a poder guardar nada.
 */
export const billingConfigDto = z.object({
  publishableKey: z.string().nullish(),
  enabled: z.boolean().default(false),
})

/**
 * Intento de guardado de tarjeta. El secreto es OBLIGATORIO y sin valor por omisión: sin él no hay
 * nada que confirmar contra la pasarela, y tolerarlo vacío daría por bueno un alta que no existe.
 */
export const setupIntentDto = z.object({ clientSecret: z.string().min(1) })

export type AddressDto = z.infer<typeof addressDto>
export type ShippingQuoteDto = z.infer<typeof shippingQuoteDto>
export type PlacedOrderDto = z.infer<typeof placedOrderDto>
export type WalletDto = z.infer<typeof walletDto>
export type WalletTransactionDto = z.infer<typeof walletTransactionDto>
export type WalletTransactionPageDto = z.infer<typeof walletTransactionPageDto>
export type RechargeOptionsDto = z.infer<typeof rechargeOptionsDto>
export type RechargeDto = z.infer<typeof rechargeDto>
export type PaymentMethodDto = z.infer<typeof paymentMethodDto>
export type SavedCardChargeDto = z.infer<typeof savedCardChargeDto>
export type BillingConfigDto = z.infer<typeof billingConfigDto>
