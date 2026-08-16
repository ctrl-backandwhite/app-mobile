import { create } from 'zustand'

import { User } from '@features/auth/domain/entities/user'

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous'

interface SessionState {
  user: User | null
  status: SessionStatus
  /**
   * Tokens vivos en memoria. Su copia duradera está en el almacén cifrado, pero el interceptor de
   * peticiones es síncrono y no puede esperar a una lectura del Keychain, así que necesita tenerlos
   * a mano.
   */
  accessToken: string | null
  refreshToken: string | null
  currency: string
  locale: string
  signedIn: (user: User, accessToken: string, refreshToken: string) => void
  restored: (user: User, accessToken: string, refreshToken: string) => void
  anonymous: () => void
  setUser: (user: User) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setCurrency: (currency: string) => void
  setLocale: (locale: string) => void
}

/**
 * Arranca en `loading` a propósito: hasta que no se comprueba si hay sesión guardada, la navegación
 * no debe decidir nada. Si empezara en `anonymous`, quien ya tiene sesión vería aparecer la pantalla
 * de acceso durante un instante antes de que se le expulsara de ella.
 */
export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  status: 'loading',
  accessToken: null,
  refreshToken: null,
  currency: 'USD',
  locale: 'es',

  signedIn: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken, status: 'authenticated', locale: user.language ?? 'es' }),

  restored: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken, status: 'authenticated', locale: user.language ?? 'es' }),

  anonymous: () => set({ user: null, accessToken: null, refreshToken: null, status: 'anonymous' }),

  setUser: (user) => set({ user }),

  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

  setCurrency: (currency) => set({ currency }),

  setLocale: (locale) => set({ locale }),
}))
