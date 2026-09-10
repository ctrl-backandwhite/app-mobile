import { useEffect } from 'react'

import { useContainer } from '@composition/container.provider'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

/**
 * Anota la visita a una ficha, una sola vez por producto abierto.
 *
 * <p>Solo con sesión iniciada: el historial es de una cuenta, y sin ella el servidor no sabría a quién
 * apuntárselo. Sin bloquear ni esperar nada —la ficha ya se está pintando— y sin avisar de un fallo:
 * si la anotación no llega, lo único que se pierde es una línea del historial.
 */
export function useRecordView(productId: string | undefined): void {
  const { recordProductView } = useContainer()
  const status = useSessionStore((state) => state.status)

  useEffect(() => {
    if (!productId || status !== 'authenticated') return
    void recordProductView.execute(productId)
  }, [productId, recordProductView, status])
}
