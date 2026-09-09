import { z } from 'zod'

/**
 * Contrato de las respuestas del backend, validado en la frontera.
 *
 * Validar aquí hace que una ruptura del contrato falle en el sitio donde se puede diagnosticar, en
 * lugar de propagarse como un `undefined` hasta una pantalla.
 *
 * <p>Lo que falta viaja de DOS formas y hay que admitir las dos: el backend a veces omite el campo y
 * a veces lo manda como `null` explícito. `optional()` acepta lo primero pero NO lo segundo, y con eso
 * era imposible entrar en la aplicación: un usuario sin teléfono ni avatar —la mayoría— llegaba con
 * `phone: null`, la validación se caía y la pantalla decía «La respuesta del servidor no tiene el
 * formato esperado» sin más pista. Por eso `nullish()`, que admite las dos y las traduce a ausencia.
 */
export const userDto = z.object({
  id: z.string(),
  email: z.string(),
  role: z.enum(['ADMIN', 'OPERATOR', 'PARTNER', 'USER']),
  active: z.boolean(),
  displayName: z.string().nullish(),
  firstName: z.string().nullish(),
  lastName1: z.string().nullish(),
  lastName2: z.string().nullish(),
  fullName: z.string().nullish(),
  companyName: z.string().nullish(),
  country: z.string().nullish(),
  language: z.string().nullish(),
  phone: z.string().nullish(),
  avatarUrl: z.string().nullish(),
  createdAt: z.string(),
  lastLogin: z.string().nullish(),
  authorities: z.array(z.string()).default([]),
})

export const loginDto = z.object({
  token: z.string(),
  refreshToken: z.string(),
  tokenType: z.string().nullish(),
  expiresIn: z.number().nullish(),
  user: userDto,
})

export const registerDto = z.object({
  userId: z.string(),
  message: z.string().nullish(),
})

export const challengeDto = z.object({
  algorithm: z.string(),
  challenge: z.string(),
  maxnumber: z.number(),
  salt: z.string(),
  signature: z.string(),
})

export type UserDto = z.infer<typeof userDto>
export type LoginDto = z.infer<typeof loginDto>
export type RegisterDto = z.infer<typeof registerDto>
export type ChallengeDto = z.infer<typeof challengeDto>
