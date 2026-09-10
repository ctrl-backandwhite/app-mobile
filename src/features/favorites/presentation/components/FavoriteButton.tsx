import { Heart } from 'lucide-react-native'
import { ReactElement, useState } from 'react'
import { Pressable } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { useTheme } from '@ds/tokens'

import { useFavoritesStore } from '../state/favorites.store'

interface Props {
  productId: string
  size?: number
}

/**
 * Corazón de «me interesa».
 *
 * El estado cambia en el acto y se revierte si el servidor lo rechaza. Esperar a la respuesta para
 * pintar el corazón haría que el toque pareciera ignorado en una conexión lenta, que es justo cuando
 * más se nota.
 */
export function FavoriteButton({ productId, size = 22 }: Props): ReactElement {
  const { toggleFavorite } = useContainer()
  const isFavorite = useFavoritesStore((state) => state.ids.has(productId))
  const mark = useFavoritesStore((state) => state.mark)
  const unmark = useFavoritesStore((state) => state.unmark)
  const [busy, setBusy] = useState(false)
  const palette = useTheme()

  async function press(): Promise<void> {
    if (busy) return
    setBusy(true)
    const previous = isFavorite

    if (previous) unmark(productId)
    else mark(productId)

    try {
      const result = await toggleFavorite.execute(productId, previous)
      if (!result.ok) {
        // Vuelta atrás: el corazón no puede quedarse contando algo que el servidor no guardó.
        if (previous) mark(productId)
        else unmark(productId)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      accessibilityState={{ selected: isFavorite }}
      onPress={press}
      hitSlop={10}
      className="h-9 w-9 items-center justify-center rounded-full bg-base-100/90"
    >
      {/* Relleno cuando está marcado: el corazón lleno se distingue del vacío de un vistazo, cosa
          que un simple cambio de color no consigue sobre una foto de cualquier tono. */}
      <Heart
        size={size}
        strokeWidth={1.5}
        color={isFavorite ? palette.error : palette.baseContent}
        fill={isFavorite ? palette.error : 'transparent'}
      />
    </Pressable>
  )
}
