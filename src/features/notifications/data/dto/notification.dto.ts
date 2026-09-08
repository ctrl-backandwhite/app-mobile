import { z } from 'zod'

/**
 * `payload` se ignora a propósito: es un JSON libre por tipo de evento, y validarlo obligaría a
 * tocar la app cada vez que el backend añade un campo que la app no usa.
 */
export const notificationDto = z.object({
  id: z.string(),
  eventType: z.string().nullish(),
  title: z.string().nullish(),
  body: z.string().nullish(),
  readAt: z.string().nullish(),
  createdAt: z.string().nullish(),
})

export const notificationsDto = z.array(notificationDto)

export type NotificationDto = z.infer<typeof notificationDto>
