import { useEffect } from 'react'
import { AppState, AppStateStatus } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { logger } from '@core/logger/logger'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

import { useFavoritesStore } from '../state/favorites.store'

/**
 * Mantiene al día los favoritos de la sesión.
 *
 * Se piden todos los identificadores de golpe porque la rejilla del catálogo necesita saber el
 * estado de cada tarjeta al pintarla; una llamada por producto multiplicaría las peticiones por el
 * tamaño de la página.
 *
 * Además se vuelven a pedir cada vez que la aplicación regresa a primer plano. Los favoritos son de
 * la persona, no del dispositivo: quien marca un producto desde el panel web espera encontrarlo
 * marcado al volver al móvil, y cargándolos solo al arrancar habría que cerrar la app para verlo.
 *
 * Al cerrar sesión se vacían: dejarlos haría que la siguiente cuenta viera corazones ajenos.
 */
export function useLoadFavorites(): void {
  const { listFavoriteIds } = useContainer()
  const status = useSessionStore((state) => state.status)

  useEffect(() => {
    if (status === 'anonymous') {
      useFavoritesStore.getState().clear()
      return
    }
    if (status !== 'authenticated') return

    let cancelled = false

    function refresh(): void {
      listFavoriteIds
        .execute()
        .then((result) => {
          if (cancelled || !result.ok) return
          useFavoritesStore.getState().replaceAll(result.value)
        })
        .catch((error: unknown) => logger.warn('No se pudieron cargar los favoritos', error))
    }

    refresh()

    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') refresh()
    })

    return () => {
      cancelled = true
      subscription.remove()
    }
  }, [status, listFavoriteIds])
}
