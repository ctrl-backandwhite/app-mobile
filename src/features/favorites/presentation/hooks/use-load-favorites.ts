import { useEffect } from 'react'

import { useContainer } from '@composition/container.provider'
import { logger } from '@core/logger/logger'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

import { useFavoritesStore } from '../state/favorites.store'

/**
 * Carga una sola vez los favoritos de la sesión.
 *
 * Se piden todos los identificadores de golpe porque la rejilla del catálogo necesita saber el
 * estado de cada tarjeta al pintarla; una llamada por producto multiplicaría las peticiones por el
 * tamaño de la página.
 *
 * Al cerrar sesión se vacían: son de la persona, no del dispositivo, y dejarlos haría que la
 * siguiente cuenta viera corazones ajenos.
 */
export function useLoadFavorites(): void {
  const { listFavoriteIds } = useContainer()
  const status = useSessionStore((state) => state.status)
  const loaded = useFavoritesStore((state) => state.loaded)

  useEffect(() => {
    if (status === 'anonymous') {
      useFavoritesStore.getState().clear()
      return
    }
    if (status !== 'authenticated' || loaded) return

    let cancelled = false
    listFavoriteIds
      .execute()
      .then((result) => {
        if (cancelled || !result.ok) return
        useFavoritesStore.getState().replaceAll(result.value)
      })
      .catch((error: unknown) => logger.warn('No se pudieron cargar los favoritos', error))

    return () => {
      cancelled = true
    }
  }, [status, loaded, listFavoriteIds])
}
