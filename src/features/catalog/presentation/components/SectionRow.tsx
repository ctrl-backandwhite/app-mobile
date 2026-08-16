import { ReactElement } from 'react'
import { FlatList, ListRenderItemInfo, Pressable, Text, View } from 'react-native'

import { ProductSummary } from '@features/catalog/domain/entities/product'

import { ProductCard } from './ProductCard'

interface Props {
  title: string
  products: readonly ProductSummary[]
  onSelect: (product: ProductSummary) => void
  onSeeAll?: () => void
}

/** Ancho fijo de la tarjeta en el carrusel: deja asomar la siguiente y así se ve que hay más. */
const CARD_WIDTH = 160

export function SectionRow({ title, products, onSelect, onSeeAll }: Props): ReactElement {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-5">
        <Text className="font-medium text-[18px] text-base-content">{title}</Text>
        {onSeeAll ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver todo: ${title}`}
            onPress={onSeeAll}
            hitSlop={8}
          >
            <Text className="text-[13px] text-primary">Ver todo</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        horizontal
        data={products}
        keyExtractor={(product: ProductSummary): string => product.id}
        renderItem={({ item }: ListRenderItemInfo<ProductSummary>): ReactElement => (
          <View style={{ width: CARD_WIDTH }}>
            <ProductCard product={item} onPress={onSelect} />
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        // El margen lateral va en el contenedor y no en la lista: así la primera tarjeta se alinea
        // con el título y la última no queda pegada al borde al llegar al final del desplazamiento.
        contentContainerClassName="gap-3 px-5"
      />
    </View>
  )
}
