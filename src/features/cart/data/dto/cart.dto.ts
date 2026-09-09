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
  variantId: z.string().nullish(),
  slug: z.string().default(''),
  title: z.string().default(''),
  image: z.string().nullish(),
  variantLabel: z.string().nullish(),
  sku: z.string().nullish(),
  quantity: z.number().default(1),
  moq: z.number().nullish(),
})

export const cartLinesDto = z.array(cartLineDto)

export const quoteLineDto = z.object({
  productId: z.string(),
  variantId: z.string().nullish(),
  unitFormatted: z.string().nullish(),
  lineTotalFormatted: z.string().nullish(),
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
  subtotalFormatted: z.string().nullish(),
})

export type CartLineDto = z.infer<typeof cartLineDto>
export type QuoteLineDto = z.infer<typeof quoteLineDto>
export type CartQuoteDto = z.infer<typeof cartQuoteDto>
