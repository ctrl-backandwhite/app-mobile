import { Ionicons } from '@expo/vector-icons'
import { ReactElement, useState } from 'react'
import { Pressable } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { colors } from '@ds/tokens'

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
      <Ionicons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={size}
        color={isFavorite ? colors.light.error : colors.light.baseContent}
      />
    </Pressable>
  )
}
