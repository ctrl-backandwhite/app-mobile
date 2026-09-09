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
  const { restoreSession, sessionStorage, loadPreferences, deviceIdReady } = useContainer()

  useEffect(() => {
    let cancelled = false

    async function bootstrap(): Promise<void> {
      // El idioma y la divisa guardados se aplican ANTES que nada. El cliente HTTP los lee del
      // almacén de sesión para componer cada petición, así que aplicarlos después dejaría que la
      // primera lectura saliera con los valores por defecto y la pantalla cambiara sola un instante
      // más tarde: precios en dólares que pasan a euros delante de quien mira.
      //
      // Va aparte, y no dentro del intento general, porque un fallo del almacén NO puede impedir
      // entrar: la preferencia es un adorno y la sesión no. Sin este resguardo, un almacén ilegible
      // rompía la promesa aquí mismo y la aplicación se quedaba en «cargando» para siempre, sin
      // llegar nunca ni a restaurar la sesión ni a declararse anónima.
      try {
        const preferidas = await loadPreferences.execute()
        if (preferidas.locale) useSessionStore.getState().setLocale(preferidas.locale)
        if (preferidas.currency) useSessionStore.getState().setCurrency(preferidas.currency)
      } catch {
        // Se arranca con el idioma y la divisa por defecto.
      }

      // Antes de la PRIMERA petición: el backend reconoce el teléfono por esta cabecera y, sin
      // ella, registra una sesión nueva que luego aparece en «sesiones abiertas» como si fuera otro
      // aparato. Un fallo al prepararla no puede impedir entrar.
      await deviceIdReady.catch(() => undefined)

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
  }, [restoreSession, sessionStorage, loadPreferences, deviceIdReady])
}
