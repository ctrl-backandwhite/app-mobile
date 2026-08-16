import { z } from 'zod'

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
  label: z.string().nullable().optional(),
  fullName: z.string().default(''),
  phone: z.string().nullable().optional(),
  line1: z.string().default(''),
  line2: z.string().nullable().optional(),
  city: z.string().default(''),
  state: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().default(''),
  // El backend la llama `default`, que en JavaScript no es palabra reservada como clave.
  default: z.boolean().default(false),
})

export const addressListDto = z.array(addressDto)

export const shippingQuoteDto = z.object({
  supported: z.boolean().default(false),
  countryCode: z.string().nullable().optional(),
  carrier: z.string().nullable().optional(),
  serviceName: z.string().nullable().optional(),
  etaMinDays: z.number().default(0),
  etaMaxDays: z.number().default(0),
  taxRateBps: z.number().default(0),
  subtotalUsdCents: z.number().default(0),
  customsHandlingUsdCents: z.number().default(0),
  discountCents: z.number().default(0),
  subtotalFormatted: z.string().nullable().optional(),
  shippingFormatted: z.string().nullable().optional(),
  shippingBaseFormatted: z.string().nullable().optional(),
  customsHandlingFormatted: z.string().nullable().optional(),
  taxFormatted: z.string().nullable().optional(),
  totalFormatted: z.string().nullable().optional(),
  discountFormatted: z.string().nullable().optional(),
  customsThresholdExceeded: z.boolean().default(false),
  customsBlocked: z.boolean().default(false),
  customsLimit: z.string().nullable().optional(),
  taxMode: z.string().nullable().optional(),
  couponCode: z.string().nullable().optional(),
  couponError: z.string().nullable().optional(),
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
  paymentMethod: z.string().nullable().optional(),
  totalFormatted: z.string().nullable().optional(),
  approveUrl: z.string().nullable().optional(),
  approvalUrl: z.string().nullable().optional(),
})

export const walletDto = z.object({
  availableUsdCents: z.number().default(0),
  balanceFormatted: z.string().nullable().optional(),
  displayCurrency: z.string().default(''),
  status: z.string().default(''),
})

/**
 * Método de pago guardado. `type` se valida como texto libre y es el mapeador quien descarta los
 * que la app no sabe pintar: con un `enum` estricto, un tipo nuevo en el servidor tumbaría la lista
 * entera y dejaría a la persona sin poder pagar con los que sí conoce.
 */
export const paymentMethodDto = z.object({
  id: z.string(),
  type: z.string().default(''),
  brand: z.string().nullable().optional(),
  last4: z.string().nullable().optional(),
  expMonth: z.number().nullable().optional(),
  expYear: z.number().nullable().optional(),
  paypalEmail: z.string().nullable().optional(),
  isDefault: z.boolean().default(false),
})

export const paymentMethodListDto = z.array(paymentMethodDto)

export const savedCardChargeDto = z.object({
  status: z.string().default(''),
  clientSecret: z.string().nullable().optional(),
  paymentId: z.string().nullable().optional(),
})

export type AddressDto = z.infer<typeof addressDto>
export type ShippingQuoteDto = z.infer<typeof shippingQuoteDto>
export type PlacedOrderDto = z.infer<typeof placedOrderDto>
export type WalletDto = z.infer<typeof walletDto>
export type PaymentMethodDto = z.infer<typeof paymentMethodDto>
export type SavedCardChargeDto = z.infer<typeof savedCardChargeDto>
