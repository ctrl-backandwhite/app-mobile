import { useCallback, useEffect } from 'react'

import { useContainer } from '@composition/container.provider'
import { totalUnits } from '@features/cart/domain/entities/cart-line'

import { useCartCountStore } from '../state/cart-count.store'

/**
 * Pone al día el contador de la cesta leyendo lo que hay guardado.
 *
 * Devuelve la función de refresco para quien cambie la cesta desde fuera de su pantalla —añadir
 * desde la ficha, por ejemplo—: sin eso el distintivo se quedaría con la cuenta anterior hasta la
 * siguiente apertura de la aplicación.
 */
export function useSyncCartCount(): () => void {
  const { loadCart } = useContainer()
  const setUnits = useCartCountStore((state) => state.setUnits)

  const refresh = useCallback((): void => {
    void loadCart.execute().then((lines) => setUnits(totalUnits(lines)))
  }, [loadCart, setUnits])

  useEffect(refresh, [refresh])

  return refresh
}
