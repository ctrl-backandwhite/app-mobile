import { useEffect } from 'react'

import { useContainer } from '@composition/container.provider'

import { useSessionStore } from '../state/session.store'

/**
 * Restaura la sesión al arrancar la aplicación.
 *
 * El orden importa. Los tokens viven en el almacén cifrado, pero el interceptor del cliente HTTP
 * los lee de memoria y de forma síncrona, así que hay que publicarlos **antes** de pedir el perfil.
 * Sin ese paso, la petición saldría sin cabecera de autorización y una sesión válida se descartaría
 * en cada arranque.
 */
export function useBootstrapSession(): void {
  const { restoreSession, sessionStorage } = useContainer()

  useEffect(() => {
    let cancelled = false

    async function bootstrap(): Promise<void> {
      const stored = await sessionStorage.load()
      if (stored) useSessionStore.getState().setTokens(stored.accessToken, stored.refreshToken)

      const result = await restoreSession.execute()
      if (cancelled) return

      if (result.ok && result.value) {
        const { user, accessToken, refreshToken } = result.value
        useSessionStore.getState().restored(user, accessToken, refreshToken)
      } else {
        useSessionStore.getState().anonymous()
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [restoreSession, sessionStorage])
}
