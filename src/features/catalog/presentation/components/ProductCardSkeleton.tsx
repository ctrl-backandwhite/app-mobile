import { ReactElement } from 'react'
import { View } from 'react-native'

/**
 * Hueco de `ProductCard` mientras llega la respuesta.
 *
 * Repite sus medidas exactas —imagen cuadrada, relleno de 12 px, dos líneas de título y una de
 * precio— para que la rejilla no dé un salto al sustituir el hueco por la tarjeta real.
 */
export function ProductCardSkeleton(): ReactElement {
  return (
    <View
      testID="product-card-skeleton"
      // Ausente del árbol accesible: un lector de pantalla no debe anunciar un cargador vacío.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="overflow-hidden rounded-box border border-base-300 bg-base-100"
    >
      <View className="aspect-square w-full bg-base-200" />
      <View className="gap-1.5 p-3">
        <View className="min-h-[36px] gap-1.5">
          <View className="h-3 w-full rounded-selector bg-base-200" />
          <View className="h-3 w-3/5 rounded-selector bg-base-200" />
        </View>
        <View className="h-4 w-1/2 rounded-selector bg-base-200" />
        <View className="h-3 w-2/5 rounded-selector bg-base-200" />
      </View>
    </View>
  )
}
