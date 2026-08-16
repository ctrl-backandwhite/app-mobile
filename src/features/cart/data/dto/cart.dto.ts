import { z } from 'zod'

/**
 * Contrato de la cesta, validado en la frontera.
 *
 * TOLERANTE a propósito: las listas guardadas las escribe también el panel web, que añade a cada
 * línea campos que aquí no interesan —entre ellos el precio congelado al añadirla—. `z.object`
 * descarta lo que no conoce, así que esos campos se quedan fuera del dominio y ninguna pantalla
 * puede pintar un importe que no venga del presupuesto del backend.
 *
 * El mismo esquema valida el JSON persistido en el dispositivo: una cesta escrita por una versión
 * anterior de la app se lee sin romper nada.
 */
export const cartLineDto = z.object({
  productId: z.string(),
  // El backend manda `null` cuando el producto no tiene variantes, no ausencia de campo.
  variantId: z.string().nullable().optional(),
  slug: z.string().default(''),
  title: z.string().default(''),
  image: z.string().nullable().optional(),
  variantLabel: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  quantity: z.number().default(1),
  moq: z.number().nullable().optional(),
})

export const cartLinesDto = z.array(cartLineDto)

export const quoteLineDto = z.object({
  productId: z.string(),
  variantId: z.string().nullable().optional(),
  unitFormatted: z.string().optional(),
  lineTotalFormatted: z.string().optional(),
})

/**
 * Del presupuesto solo se recoge lo ya formateado: `unit`, `lineTotal` y `subtotal` también viajan
 * como números, pero pintarlos exigiría elegir divisa y formato en el cliente, que es justo lo que
 * no se hace aquí.
 */
export const cartQuoteDto = z.object({
  currency: z.string(),
  symbol: z.string().default(''),
  items: z.array(quoteLineDto).default([]),
  subtotalFormatted: z.string().optional(),
})

export type CartLineDto = z.infer<typeof cartLineDto>
export type QuoteLineDto = z.infer<typeof quoteLineDto>
export type CartQuoteDto = z.infer<typeof cartQuoteDto>
