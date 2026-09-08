import { z } from 'zod'

/** Solo lo que se usa: el resto de campos del backend —posición, id, tasas— no pinta nada aquí. */
export const languagesDto = z.array(
  z.object({
    code: z.string(),
    label: z.string(),
    flag: z.string().nullish(),
    active: z.boolean().nullish(),
  }),
)

export const currenciesDto = z.array(
  z.object({
    code: z.string(),
    name: z.string(),
    symbol: z.string().nullish(),
    flagEmoji: z.string().nullish(),
    active: z.boolean().nullish(),
  }),
)
