import { useEffect, useRef } from 'react'

import { useContainer } from '@composition/container.provider'
import { logger } from '@core/logger/logger'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

/**
 * Sube al servidor la cesta que quedó en el dispositivo al iniciar sesión.
 *
 * Se hace una sola vez por sesión: la referencia recuerda si ya se fundió, porque el efecto vuelve a
 * ejecutarse con cada cambio del estado y repetir la fusión sumaría las cantidades otra vez.
 *
 * Solo se vacía la cesta local **después** de que el servidor confirme. Al revés, un fallo de red
 * dejaría a la persona sin lo que había puesto en ninguno de los dos sitios.
 */
export function useMergeGuestCart(): void {
  const { mergeGuestLines, cartStorage } = useContainer()
  const status = useSessionStore((state) => state.status)
  const merged = useRef(false)

  useEffect(() => {
    if (status === 'anonymous') {
      merged.current = false
      return
    }
    if (status !== 'authenticated' || merged.current) return

    merged.current = true
    let cancelled = false

    cartStorage
      .guestLines()
      .then(async (lines) => {
        if (cancelled || lines.length === 0) return
        const result = await mergeGuestLines.execute(lines)
        if (cancelled) return
        if (result.ok) await cartStorage.clearGuest()
        else logger.warn('No se pudo fundir la cesta del invitado', result.error)
      })
      .catch((error: unknown) => logger.warn('No se pudo fundir la cesta del invitado', error))

    return () => {
      cancelled = true
    }
  }, [status, mergeGuestLines, cartStorage])
}
