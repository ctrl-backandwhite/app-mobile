import { Undo2, X } from 'lucide-react-native'
import { ReactElement } from 'react'
import { Pressable, View } from 'react-native'

import { Icon, RemoteImage, Text } from '@ds/components'
import { CartLine } from '@features/cart/domain/entities/cart-line'

interface Props {
  lines: readonly CartLine[]
  onMoveToCart: (line: CartLine) => void
  onRemove: (line: CartLine) => void
}

/** Una línea guardada se identifica por producto y variante, igual que en la cesta. */
function keyOf(line: CartLine): string {
  return `${line.productId}:${line.variantId ?? ''}`
}

/**
 * Lista compacta bajo la cesta. Aquí no se pinta importe: lo guardado no entra en el presupuesto,
 * y enseñar un precio de otro momento induciría a creer que sigue vigente.
 */
export function SavedForLaterList({ lines, onMoveToCart, onRemove }: Props): ReactElement | null {
  if (lines.length === 0) {
    return null
  }

  return (
    <View testID="saved-for-later" className="gap-2 border-t border-base-200 px-4 py-4">
      <View className="flex-row items-center gap-2 pb-1">
        <Text variant="eyebrow" tone="muted">
          Guardado para más tarde
        </Text>
        <Text variant="caption" tone="muted">
          ({lines.length})
        </Text>
      </View>

      {lines.map((line: CartLine): ReactElement => (
        <View key={keyOf(line)} className="flex-row items-center gap-3 py-1.5">
          {line.image ? (
            <RemoteImage uri={line.image} className="h-10 w-10 rounded-selector bg-base-200" />
          ) : (
            <View className="h-10 w-10 rounded-selector bg-base-200" />
          )}

          <View className="flex-1 gap-0.5">
            <Text numberOfLines={1} variant="caption">
              {line.title}
            </Text>
            {line.variantLabel ? (
              <Text numberOfLines={1} variant="caption" tone="muted">
                {line.variantLabel}
              </Text>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Mover ${line.title} a la cesta`}
            onPress={(): void => onMoveToCart(line)}
            hitSlop={4}
            className="h-9 flex-row items-center gap-1.5 rounded-field border border-base-300 px-3 active:opacity-70"
          >
            <Icon glyph={Undo2} size="sm" tone="default" />
            <Text variant="caption" className="shrink-0">
              Mover
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${line.title} de guardados`}
            onPress={(): void => onRemove(line)}
            hitSlop={6}
            className="h-9 w-8 items-center justify-center active:opacity-70"
          >
            <Icon glyph={X} size="md" tone="muted" />
          </Pressable>
        </View>
      ))}
    </View>
  )
}
