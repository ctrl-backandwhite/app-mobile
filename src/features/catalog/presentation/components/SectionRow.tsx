import { ChevronRight } from 'lucide-react-native'
import { ReactElement } from 'react'
import { Pressable, View } from 'react-native'

import { Icon, Text } from '@ds/components'
import { ProductSummary } from '@features/catalog/domain/entities/product'

import { ProductCard } from './ProductCard'

interface Props {
  title: string
  products: readonly ProductSummary[]
  onSelect: (product: ProductSummary) => void
  onSeeAll?: () => void
  /** Antetítulo en versales sobre el título: dice POR QUÉ está aquí este bloque. */
  eyebrow?: string
  /** Compra rápida desde la tarjeta, si la pantalla la ofrece. */
  onAdd?: (product: ProductSummary) => void
  /** Identificador del producto recién añadido, para marcar solo su botón. */
  addedId?: string
}

const COLUMNAS = 2

/** Reparte los productos en filas de dos, que es la rejilla del escaparate. */
function enFilas(products: readonly ProductSummary[]): ProductSummary[][] {
  const filas: ProductSummary[][] = []
  for (let i = 0; i < products.length; i += COLUMNAS) {
    filas.push([...products.slice(i, i + COLUMNAS)])
  }
  return filas
}

/**
 * Un bloque de productos de la portada.
 *
 * <p>En rejilla y no en carrusel: en horizontal solo se veían dos productos y medio de los ocho que
 * trae cada bloque, y los demás quedaban detrás de un gesto que nadie hace. La rejilla los enseña
 * todos y es además la misma disposición que el catálogo, así que la portada y el listado se leen
 * igual.
 */
export function SectionRow({
  title,
  products,
  onSelect,
  onSeeAll,
  eyebrow,
  onAdd,
  addedId,
}: Props): ReactElement {
  return (
    <View className="gap-3">
      <View className="flex-row items-end justify-between px-5">
        <View className="flex-1 gap-0.5">
          {eyebrow ? (
            <Text variant="eyebrow" tone="muted">
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="title">{title}</Text>
        </View>
        {onSeeAll ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver todo: ${title}`}
            onPress={onSeeAll}
            hitSlop={8}
            className="flex-row items-center gap-0.5 pb-1"
          >
            <Text variant="label" tone="primary" className="shrink-0">
              Ver todo
            </Text>
            <Icon glyph={ChevronRight} size="sm" tone="primary" />
          </Pressable>
        ) : null}
      </View>

      <View className="gap-3 px-5">
        {enFilas(products).map((fila) => (
          <View key={fila[0]?.id} className="flex-row gap-3">
            {fila.map((product) => (
              <View key={product.id} className="flex-1">
                <ProductCard
                  product={product}
                  onPress={onSelect}
                  onAdd={onAdd}
                  added={addedId === product.id}
                />
              </View>
            ))}
            {/* Hueco de la última fila impar: sin él, un solo producto se estiraría a todo el ancho
                y rompería la rejilla. */}
            {fila.length < COLUMNAS ? <View className="flex-1" /> : null}
          </View>
        ))}
      </View>
    </View>
  )
}
