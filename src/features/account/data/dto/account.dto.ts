import { z } from 'zod'

/**
 * Una sesión abierta. Todo lo descriptivo llega con respaldo porque el backend lo deduce de la
 * cabecera del navegador y a veces no hay nada que deducir: una fila sin dispositivo sigue siendo
 * una sesión que hay que poder cerrar.
 */
export const activeSessionDto = z.object({
  id: z.string(),
  device: z.string().nullish(),
  ip: z.string().nullish(),
  createdAt: z.string().nullish(),
  lastSeenAt: z.string().nullish(),
  current: z.boolean().nullish(),
})

export const activeSessionsDto = z.array(activeSessionDto)

export type ActiveSessionDto = z.infer<typeof activeSessionDto>
