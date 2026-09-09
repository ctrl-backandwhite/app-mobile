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
 * Contrato de las respuestas de pedidos, validado en la frontera.
 *
 * Es deliberadamente TOLERANTE: lo que el backend puede omitir va como `.nullish()`, lo que puede
 * llegar a `null` lleva además `.nullable()`, y las listas llevan `.default([])`. `z.object` descarta
 * los campos que no conoce, así que un campo nuevo en la API —o uno que solo interesa al panel de
 * administración— no rompe la aplicación instalada. Lo que sí rompe es que falte un campo
 * imprescindible, y ese fallo se quiere explícito: sale como error `CONTRACT` en la frontera y no
 * como un `undefined` en mitad de una pantalla.
 */
const optionalString = z.string().nullish()

/**
 * Del pedido solo se recogen los importes YA formateados. `totalCents` también viaja, pero pintarlo
 * exigiría elegir divisa y formato en el cliente, que es justo lo que no se hace aquí.
 */
export const orderRowDto = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.string(),
  paymentMethod: optionalString,
  totalFormatted: optionalString,
  currency: z.string().default(''),
  itemCount: z.number().default(0),
  placedAt: z.string(),
  shippedAt: optionalString,
  deliveredAt: optionalString,
})

export const orderListDto = z.array(orderRowDto)

export const orderAddressDto = z.object({
  fullName: z.string().default(''),
  phone: optionalString,
  email: optionalString,
  line1: z.string().default(''),
  line2: optionalString,
  city: z.string().default(''),
  state: optionalString,
  postalCode: optionalString,
  country: z.string().default(''),
})

/**
 * `unitPrice` y `lineTotal` llegan como cadenas crudas, sin divisa ni separadores, y no se recogen:
 * pintarlas exigiría dar formato en el cliente. Solo entran las versiones formateadas.
 */
export const orderItemDto = z.object({
  id: z.string(),
  productId: z.string().default(''),
  variantId: optionalString,
  productTitle: z.string().default(''),
  variantName: optionalString,
  imageUrl: optionalString,
  quantity: z.number().default(1),
  unitPriceFormatted: optionalString,
  lineTotalFormatted: optionalString,
})

export const orderDetailDto = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.string(),
  paymentMethod: optionalString,
  currency: z.string().default(''),
  subtotalFormatted: optionalString,
  shippingFormatted: optionalString,
  // El derecho de aduana, APARTE del porte. En la base viven sumados en `shipping_cents`,
  // y enseñarlos juntos aquí contradecía el resumen del pago, que sí los separa.
  customsDutyFormatted: optionalString,
  taxFormatted: optionalString,
  totalFormatted: optionalString,
  discountFormatted: optionalString,
  shippingAddress: orderAddressDto.nullish(),
  notes: optionalString,
  trackingCarrier: optionalString,
  trackingNumber: optionalString,
  placedAt: optionalString,
  shippedAt: optionalString,
  deliveredAt: optionalString,
  cancelledAt: optionalString,
  items: z.array(orderItemDto).default([]),
})

export const trackingEventDto = z.object({
  status: z.string().default(''),
  description: optionalString,
  location: optionalString,
  source: optionalString,
  occurredAt: optionalString,
})

export const shipmentDto = z.object({
  sequenceNo: z.number().default(0),
  carrier: optionalString,
  trackingNumber: optionalString,
  status: optionalString,
  weightGrams: z.number().default(0),
  estimatedDeliveryAt: optionalString,
  events: z.array(trackingEventDto).default([]),
})

/** Sin bultos declarados el pedido viaja en un solo paquete: entonces basta con `events`. */
export const trackingDto = z.object({
  status: optionalString,
  carrier: optionalString,
  trackingNumber: optionalString,
  estimatedDeliveryAt: optionalString,
  lastTrackedAt: optionalString,
  events: z.array(trackingEventDto).default([]),
  shipments: z.array(shipmentDto).default([]),
})

export type OrderRowDto = z.infer<typeof orderRowDto>
export type OrderAddressDto = z.infer<typeof orderAddressDto>
export type OrderItemDto = z.infer<typeof orderItemDto>
export type OrderDetailDto = z.infer<typeof orderDetailDto>
export type TrackingEventDto = z.infer<typeof trackingEventDto>
export type ShipmentDto = z.infer<typeof shipmentDto>
export type TrackingDto = z.infer<typeof trackingDto>
