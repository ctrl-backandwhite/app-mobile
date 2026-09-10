import { create } from 'zustand'

interface CartCountState {
  /** Unidades en la cesta. Es lo que enseña el distintivo de la pestaña. */
  units: number
  setUnits: (units: number) => void
}

/**
 * Cuántas unidades hay en la cesta, para pintarlas sobre la pestaña.
 *
 * <p>Vive en un almacén y no en la pantalla de la cesta porque quien necesita el número es la barra
 * de pestañas, que está montada siempre y no puede depender de que la cesta se haya abierto alguna
 * vez. Sin esto, añadir un producto no dejaba ninguna señal visible: había que entrar en la cesta
 * para saber si el toque había servido de algo.
 *
 * <p>Solo guarda el CONTADOR, no las líneas: la cesta es la dueña de su contenido y duplicarlo aquí
 * abriría dos versiones de la verdad.
 */
export const useCartCountStore = create<CartCountState>((set) => ({
  units: 0,
  setUnits: (units) => set({ units }),
}))
