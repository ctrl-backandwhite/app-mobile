import { z } from 'zod'

/**
 * Contrato de las respuestas del backend, validado en la frontera.
 *
 * Los campos opcionales lo son porque el backend los omite cuando están vacíos. Validar aquí hace
 * que una ruptura del contrato falle en el sitio donde se puede diagnosticar, en lugar de
 * propagarse como un `undefined` hasta una pantalla.
 */
export const userDto = z.object({
  id: z.string(),
  email: z.string(),
  role: z.enum(['ADMIN', 'OPERATOR', 'PARTNER', 'USER']),
  active: z.boolean(),
  displayName: z.string().optional(),
  firstName: z.string().optional(),
  lastName1: z.string().optional(),
  lastName2: z.string().optional(),
  fullName: z.string().optional(),
  companyName: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
  createdAt: z.string(),
  lastLogin: z.string().optional(),
  authorities: z.array(z.string()).default([]),
})

export const loginDto = z.object({
  token: z.string(),
  refreshToken: z.string(),
  tokenType: z.string().optional(),
  expiresIn: z.number().optional(),
  user: userDto,
})

export const registerDto = z.object({
  userId: z.string(),
  message: z.string().optional(),
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
