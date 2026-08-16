import { create } from 'zustand'

interface FavoritesState {
  /** Identificadores marcados. Un conjunto y no una lista: la consulta «¿está marcado?» ocurre una
   *  vez por tarjeta en cada pintado de la rejilla. */
  ids: Set<string>
  loaded: boolean
  replaceAll: (ids: readonly string[]) => void
  mark: (productId: string) => void
  unmark: (productId: string) => void
  clear: () => void
}

export const useFavoritesStore = create<FavoritesState>((set) => ({
  ids: new Set<string>(),
  loaded: false,

  replaceAll: (ids) => set({ ids: new Set(ids), loaded: true }),

  // Se crea un conjunto nuevo en cada cambio a propósito: mutar el existente no cambiaría la
  // referencia y las tarjetas suscritas no se repintarían.
  mark: (productId) =>
    set((state) => {
      const next = new Set(state.ids)
      next.add(productId)
      return { ids: next }
    }),

  unmark: (productId) =>
    set((state) => {
      const next = new Set(state.ids)
      next.delete(productId)
      return { ids: next }
    }),

  clear: () => set({ ids: new Set<string>(), loaded: false }),
}))
