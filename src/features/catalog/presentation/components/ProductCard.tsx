import { ReactElement } from 'react'
import { Image, Pressable, Text, View } from 'react-native'

import { hasDiscount, ProductSummary } from '@features/catalog/domain/entities/product'

interface Props {
  product: ProductSummary
  onPress: (product: ProductSummary) => void
}

/**
 * Estrella dibujada con vistas: la unión de un cuadrado y su copia girada 45° da una estrella de
 * ocho puntas. No hay familia de iconos instalada y un emoji rompería el trazo del escritorio.
 */
function StarMark(): ReactElement {
  return (
    <View className="h-3 w-3 items-center justify-center">
      <View className="absolute h-2 w-2 bg-accent" />
      <View className="absolute h-2 w-2 rotate-45 bg-accent" />
    </View>
  )
}

/** Llama de las ventas: gota con tres esquinas redondeadas y la cuarta en punta, girada hacia arriba. */
function FlameMark(): ReactElement {
  return (
    <View className="h-3 w-3 items-center justify-center">
      <View className="h-2 w-2 rotate-45 rounded-bl-full rounded-br-full rounded-tr-full bg-warning" />
    </View>
  )
}

/**
 * Miles abreviados a partir de 10.000, igual que la tarjeta del escritorio: el número exacto de
 * ventas no aporta nada en una tarjeta de 160 px y sí desborda la fila.
 */
function formatSales(monthlySales: number): string {
  return monthlySales > 9999 ? `${(monthlySales / 1000).toFixed(1)}k` : String(monthlySales)
}

export function ProductCard({ product, onPress }: Props): ReactElement {
  const price = product.displayFormatted
  // La regla de cuándo hay rebaja vive en el dominio: aquí solo se decide cómo se pinta.
  const onSale = hasDiscount(product)
  const sales = product.monthlySales > 0 ? formatSales(product.monthlySales) : null

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={price ? `${product.title}, ${price}` : product.title}
      accessibilityHint={product.promotionName}
      onPress={() => onPress(product)}
      className="overflow-hidden rounded-box border border-base-300 bg-base-100"
    >
      {product.mainImage ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: product.mainImage }}
          resizeMode="cover"
          className="aspect-square w-full bg-base-200"
        />
      ) : (
        <View className="aspect-square w-full bg-base-200" />
      )}

      <View className="gap-1.5 p-3">
        {/* Dos líneas fijas: sin la altura mínima, un título corto y otro largo descuadran la fila. */}
        <Text numberOfLines={2} className="min-h-[36px] text-[13px] leading-[18px] text-base-content">
          {product.title}
        </Text>

        {price ? (
          <View className="flex-row flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <Text className="font-medium text-[15px] text-base-content">{price}</Text>
            {onSale ? (
              <>
                <Text className="text-[11px] text-error line-through">{product.originalFormatted}</Text>
                <View className="rounded-selector bg-error px-1 py-px">
                  <Text className="text-[10px] font-medium text-error-content">
                    −{product.discountPercent}%
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        ) : null}

        {product.rating != null || sales ? (
          <View className="flex-row items-center gap-3">
            {product.rating != null ? (
              <View className="flex-row items-center gap-1">
                <StarMark />
                <Text className="text-[11px] text-base-content opacity-70">
                  {product.rating.toFixed(1)}
                </Text>
              </View>
            ) : null}
            {sales ? (
              <View className="flex-row items-center gap-1">
                <FlameMark />
                <Text className="text-[11px] text-base-content opacity-70">{sales}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  )
}
