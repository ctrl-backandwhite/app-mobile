import { Check, Flame, HandCoins, Plus, Truck } from 'lucide-react-native'
import { ReactElement, ReactNode } from 'react'
import { Pressable, View } from 'react-native'

import { Icon, PriceTag, Rating, RemoteImage, Text } from '@ds/components'
import { hasDiscount, ProductSummary } from '@features/catalog/domain/entities/product'

interface Props {
  product: ProductSummary
  onPress: (product: ProductSummary) => void
  /**
   * Compra rápida desde la propia tarjeta. Sin esto, meter cinco referencias en la cesta obligaba a
   * entrar y salir de cinco fichas. Es opcional: donde no se pueda comprar, la tarjeta va sin botón.
   */
  onAdd?: (product: ProductSummary) => void
  /** Marca el botón como hecho durante unos segundos, igual que el escaparate. */
  added?: boolean
  /**
   * Adorno sobre la imagen, en la esquina superior derecha. Es una ranura y no un botón concreto
   * para que la tarjeta no tenga que conocer la feature de favoritos: quien la usa decide qué poner.
   */
  overlay?: ReactNode
}

/**
 * Miles abreviados a partir de 10.000, igual que la tarjeta del escritorio: el número exacto de
 * ventas no aporta nada en una tarjeta de 160 px y sí desborda la fila.
 */
function formatSales(monthlySales: number): string {
  return monthlySales > 9999 ? `${(monthlySales / 1000).toFixed(1)}k` : String(monthlySales)
}

export function ProductCard({ product, onPress, onAdd, added = false, overlay }: Props): ReactElement {
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
      className="overflow-hidden rounded-box border border-base-300 bg-base-100 active:opacity-90"
    >
      <View>
        {/*
          El tamaño lo fija la vista, no la imagen: `expo-image` no toma la proporción de una clase
          —se queda con altura cero y la foto desaparece dejando el hueco de un producto sin fotos—.
          El contenedor manda y la imagen lo llena.
        */}
        <View className="aspect-square w-full bg-base-200">
          {product.mainImage ? (
            <RemoteImage uri={product.mainImage} className="h-full w-full" />
          ) : null}
        </View>
        {overlay ? <View className="absolute right-2 top-2">{overlay}</View> : null}
      </View>

      <View className="gap-2 p-3">
        {/* Dos líneas fijas: sin la altura mínima, un título corto y otro largo descuadran la fila. */}
        <Text numberOfLines={2} variant="label" className="min-h-[36px] font-light">
          {product.title}
        </Text>

        {price ? (
          <PriceTag
            price={price}
            original={product.originalFormatted}
            discountPercent={onSale ? product.discountPercent : undefined}
          />
        ) : null}

        {product.rating != null || sales || product.dutyCovered || product.shippingCovered ? (
          <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
            {product.rating != null ? <Rating value={product.rating} compact /> : null}
            {sales ? (
              <View className="flex-row items-center gap-1">
                <Icon glyph={Flame} size="sm" tone="warning" />
                <Text variant="caption" tone="muted">
                  {sales}
                </Text>
              </View>
            ) : null}
            {/*
              Lo que pone la tienda. Solo el icono y sin cifra: con letra competiría con el precio, que
              es lo que se viene a mirar. El nombre accesible sí lo dice entero.
            */}
            {product.dutyCovered ? (
              <View accessible accessibilityRole="image" accessibilityLabel="Arancel cubierto por NX036">
                <Icon glyph={HandCoins} size="sm" tone="success" />
              </View>
            ) : null}
            {product.shippingCovered ? (
              <View accessible accessibilityRole="image" accessibilityLabel="Envío subvencionado por NX036">
                <Icon glyph={Truck} size="sm" tone="success" />
              </View>
            ) : null}
          </View>
        ) : null}

        {onAdd ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={added ? `${product.title} añadido a la cesta` : `Añadir ${product.title} a la cesta`}
            accessibilityState={{ disabled: added }}
            onPress={() => onAdd(product)}
            className={`mt-1 h-9 flex-row items-center justify-center gap-1.5 rounded-field border active:opacity-80 ${
              added ? 'border-success bg-success/[0.12]' : 'border-base-300 bg-base-100'
            }`}
          >
            <Icon glyph={added ? Check : Plus} size="sm" tone={added ? 'success' : 'default'} />
            {/* `shrink-0`: dentro de una fila, React Native encoge el texto antes que el icono y la
                última letra se perdía —el botón decía «Añadi»— sin puntos suspensivos que avisaran. */}
            <Text
              numberOfLines={1}
              variant="caption"
              tone={added ? 'success' : 'default'}
              className="shrink-0"
            >
              {added ? 'Añadido' : 'Añadir'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  )
}
