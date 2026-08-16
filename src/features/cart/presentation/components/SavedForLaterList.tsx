import { ReactElement } from 'react'
import { Image, Pressable, Text, View } from 'react-native'

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
      <View className="flex-row items-center gap-2">
        <Text className="font-medium text-[13px] text-base-content">Guardado para más tarde</Text>
        <Text className="text-[12px] text-base-content opacity-60">({lines.length})</Text>
      </View>

      {lines.map((line: CartLine): ReactElement => (
        <View key={keyOf(line)} className="flex-row items-center gap-3 py-1.5">
          {line.image ? (
            <Image
              accessibilityIgnoresInvertColors
              source={{ uri: line.image }}
              resizeMode="cover"
              className="h-10 w-10 rounded-selector bg-base-200"
            />
          ) : (
            <View className="h-10 w-10 rounded-selector bg-base-200" />
          )}

          <View className="flex-1 gap-0.5">
            <Text numberOfLines={1} className="text-[12px] text-base-content">
              {line.title}
            </Text>
            {line.variantLabel ? (
              <Text numberOfLines={1} className="text-[10px] text-base-content opacity-60">
                {line.variantLabel}
              </Text>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Mover ${line.title} a la cesta`}
            onPress={(): void => onMoveToCart(line)}
            className="h-9 justify-center rounded-field border border-base-300 px-3"
          >
            <Text className="text-[11px] text-base-content">Mover a la cesta</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${line.title} de guardados`}
            onPress={(): void => onRemove(line)}
            className="h-9 justify-center px-1"
          >
            <Text className="text-[11px] text-error">Quitar</Text>
          </Pressable>
        </View>
      ))}
    </View>
  )
}
