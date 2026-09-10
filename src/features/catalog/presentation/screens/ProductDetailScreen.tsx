import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeft, Flame, Share2, ShoppingBag } from 'lucide-react-native'
import { ReactElement, useMemo, useState } from 'react'
import { Pressable, ScrollView, Share, View } from 'react-native'

import { useAppConfig, useContainer } from '@composition/container.provider'
import { Alert, Button, Icon, PriceTag, Rating, Screen, Skeleton, Text } from '@ds/components'
import { useSessionStore } from '@features/auth/presentation/state/session.store'
import {
  imagesFor,
  isSelectionComplete,
  isSelectionUnavailable,
  priceTierFor,
  variantFor,
  variantLabelOf,
  VariantSelection,
} from '@features/catalog/domain/entities/product-detail'
import { CartLine } from '@features/cart/domain/entities/cart-line'
import { useSyncCartCount } from '@features/cart/presentation/hooks/use-sync-cart-count'
import { FavoriteButton } from '@features/favorites/presentation/components/FavoriteButton'
import { useRecordView } from '@features/history/presentation/hooks/use-record-view'

import {
  ComplianceBlock,
  EmptyState,
  PriceTierTable,
  ProductGallery,
  QuantityStepper,
  ReviewList,
  SectionRow,
  SpecificationList,
  VariantSelector,
} from '../components'

const REVIEWS_PAGE_SIZE = 5

export function ProductDetailScreen(): ReactElement {
  const { getProductDetail, listReviews, listRelatedProducts, addToCart } = useContainer()
  const locale = useSessionStore((state) => state.locale)
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const config = useAppConfig()
  // Añadir desde aquí tiene que verse en el distintivo de la pestaña, no solo en la cesta.
  const refreshCartCount = useSyncCartCount()

  const [selection, setSelection] = useState<VariantSelection>({})
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detail = useQuery({
    queryKey: ['product', slug, locale],
    enabled: Boolean(slug),
    queryFn: async () => {
      const result = await getProductDetail.execute(slug, locale)
      if (!result.ok) throw result.error
      return result.value
    },
  })

  const product = detail.data
  // Se anota al llegar la ficha y no al abrir la pantalla: hasta que no responde el servidor no se
  // sabe qué producto es —la ruta trae el nombre corto, no el identificador—.
  useRecordView(product?.id)

  const reviews = useQuery({
    queryKey: ['reviews', product?.id],
    enabled: Boolean(product?.id),
    queryFn: async () => {
      const result = await listReviews.execute({
        productId: product?.id ?? '',
        page: 0,
        size: REVIEWS_PAGE_SIZE,
      })
      if (!result.ok) throw result.error
      return result.value
    },
  })

  const related = useQuery({
    queryKey: ['related', product?.id, locale],
    enabled: Boolean(product?.id),
    queryFn: async () => {
      const result = await listRelatedProducts.execute(product?.id ?? '', locale, 8)
      if (!result.ok) throw result.error
      return result.value
    },
  })

  // La variante elegida manda sobre el producto en precio e imágenes. Cada variante parte de un
  // precio propio: mezclar el «antes» del producto con el «ahora» de la variante llegó a pintar un
  // tachado MENOR que el precio rebajado.
  const variant = useMemo(() => (product ? variantFor(product, selection) : undefined), [product, selection])
  const images = useMemo(() => (product ? imagesFor(product, selection) : []), [product, selection])
  const tier = useMemo(
    () => (product ? priceTierFor(product, quantity) : undefined),
    [product, quantity],
  )

  if (detail.isLoading) {
    return (
      <Screen padded={false} scroll={false}>
        <Skeleton className="aspect-square w-full rounded-none" />
        <View className="gap-3 p-5">
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-12 w-full" />
        </View>
      </Screen>
    )
  }

  if (detail.isError || !product) {
    return (
      <Screen>
        <EmptyState
          title="No se ha podido cargar el producto"
          message="Puede que ya no esté disponible o que falle la conexión."
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      </Screen>
    )
  }

  const price = variant?.priceFormatted ?? product.displayFormatted
  const previousPrice = variant ? variant.originalFormatted : product.originalFormatted
  const needsChoice = product.variantOptions.length > 0 && !isSelectionComplete(product, selection)
  // Elegido todo y aun así no hay variante que comprar: el eje ofrece un valor que ya no tiene
  // existencia activa detrás. Antes el botón seguía activo y la línea se guardaba SIN variante.
  const unavailable = isSelectionUnavailable(product, selection)

  const addLine = (): void => {
    // La línea guarda lo justo para pintarse: el importe lo recalcula el backend en el presupuesto.
    // Guardar aquí el precio del momento haría que la cesta enseñara un total distinto del que se
    // cobra en cuanto cambiara una regla de precio.
    const line: CartLine = {
      productId: product.id,
      variantId: variant?.id,
      slug: product.slug,
      title: product.title,
      image: images[0]?.url ?? product.mainImage,
      variantLabel: variantLabelOf(variant),
      sku: variant?.sku,
      quantity,
      moq: product.moq,
      // El servidor los exige al guardar la línea. Es lo que se VE al añadir, no un coste: el
      // importe que se cobra lo recalcula él en el presupuesto.
      unitPriceSource: product.displayPrice,
      sourceCurrency: product.displayCurrency,
    }
    // Con `catch`: sin él, un fallo al guardar dejaba el botón como si nada hubiera pasado —ni
    // «Añadido» ni error— y la cesta seguía vacía sin que nadie supiera por qué.
    void addToCart
      .execute(line)
      .then(() => {
        setError(null)
        setAdded(true)
        refreshCartCount()
        // El aviso se retira solo: dejar el botón en «Añadido» para siempre haría dudar de si una
        // segunda pulsación ha llegado a hacer algo.
        setTimeout(() => setAdded(false), 2000)
      })
      .catch(() => setError('No se ha podido añadir a la cesta. Inténtalo de nuevo.'))
  }

  /** Comparte el enlace del ESCAPARATE, que es el que puede abrir cualquiera sin la aplicación. */
  const share = (): void => {
    void Share.share({
      message: `${product.title} — ${config.webBaseUrl}/catalog/${product.slug}`,
    }).catch(() => undefined)
  }

  return (
    <Screen padded={false} scroll={false} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-6">
        <View>
          <ProductGallery images={images} videoUrl={product.videoUrl} />
          {/*
            Volver. La ficha no lleva cabecera —la galería sube hasta el borde y una barra encima se
            comería la primera foto—, así que sin esto la única salida era el gesto del sistema: en
            iOS no hay tecla de atrás, y quien no acierta con el gesto se sale de la aplicación.
          */}
          <View className="absolute left-4 top-12">
            <Pressable
              testID="volver-desde-la-ficha"
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={() => router.back()}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full bg-base-100/90"
            >
              <Icon glyph={ChevronLeft} size="lg" />
            </Pressable>
          </View>
          <View className="absolute right-4 top-12 flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Compartir producto"
              onPress={share}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full bg-base-100/90"
            >
              <Icon glyph={Share2} size="md" />
            </Pressable>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-base-100/90">
              <FavoriteButton productId={product.id} size={20} />
            </View>
          </View>
        </View>

        <View className="gap-5 p-5">
          <View className="gap-2.5">
            <Text variant="body">{product.title}</Text>

            {price ? (
              <PriceTag
                price={price}
                original={previousPrice ?? undefined}
                discountPercent={product.discountPercent}
                size="lg"
              />
            ) : null}

            {/* Prueba de venta: valoración y ventas del mes juntas, que es lo que decide si una
                referencia merece el pedido. */}
            {product.rating != null || product.monthlySales > 0 ? (
              <View className="flex-row items-center gap-4">
                {product.rating != null ? (
                  <Rating value={product.rating} count={product.reviewCount} />
                ) : null}
                {product.monthlySales > 0 ? (
                  <View className="flex-row items-center gap-1">
                    <Icon glyph={Flame} size="sm" tone="warning" />
                    <Text variant="caption" tone="muted">
                      {product.monthlySales.toLocaleString(locale)} vendidos al mes
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View className="flex-row flex-wrap items-center gap-x-4">
              {product.brand ? (
                <Text variant="caption" tone="muted">
                  {product.brand}
                </Text>
              ) : null}
              {product.moq > 1 ? (
                <Text variant="caption" tone="muted">
                  Pedido mínimo: {product.moq} unidades
                </Text>
              ) : null}
            </View>
          </View>

          {product.variantOptions.length > 0 ? (
            <VariantSelector
              options={product.variantOptions}
              selection={selection}
              onSelect={(optionName, value) =>
                setSelection((current) => ({ ...current, [optionName]: value }))
              }
            />
          ) : null}

          <View className="gap-2">
            <Text variant="label" tone="muted">
              Cantidad
            </Text>
            <QuantityStepper value={quantity} min={product.moq} onChange={setQuantity} />
          </View>

          <PriceTierTable tiers={product.priceTiers} highlighted={tier} />

          {needsChoice ? (
            <Alert variant="info" message="Elige todas las opciones para continuar." />
          ) : null}

          {unavailable ? (
            <Alert
              variant="warning"
              message="Esa combinación no está disponible. Prueba con otra opción."
            />
          ) : null}

          {error ? <Alert variant="error" message={error} /> : null}

          {added ? (
            <Pressable
              onPress={() => router.push('/(app)/(tabs)/cart')}
              accessibilityRole="link"
              hitSlop={8}
            >
              <Text variant="label" tone="primary" className="text-center">
                Ver la cesta
              </Text>
            </Pressable>
          ) : null}

          {product.description ? (
            <View className="gap-2">
              <Text variant="heading">Descripción</Text>
              <Text variant="body" tone="muted">
                {product.description}
              </Text>
            </View>
          ) : null}

          <SpecificationList specifications={product.specifications ?? []} />

          <ComplianceBlock compliance={product.compliance} />

          <ReviewList reviews={reviews.data?.items ?? []} total={product.reviewCount} />
        </View>

        {related.data && related.data.length > 0 ? (
          <SectionRow
            title="También te puede interesar"
            products={[...related.data]}
            onSelect={(other) => router.push(`/product/${other.slug}`)}
          />
        ) : null}
      </ScrollView>

      {/*
        Barra de compra fija.
        La ficha es larga —galería, variantes, tramos, especificaciones, opiniones— y el botón vivía
        a media página: al bajar a leer las opiniones había que subir de nuevo a ciegas para comprar.
        Aquí el precio y la acción acompañan durante todo el recorrido.
      */}
      <View
        className="flex-row items-center gap-4 border-t border-base-300 bg-base-100 px-5 pb-6 pt-3"
      >
        {price ? (
          <View className="gap-0.5">
            <Text variant="caption" tone="muted">
              {quantity > 1 ? `${quantity} uds. · unidad` : 'Precio'}
            </Text>
            <Text variant="price">{tier?.unitPriceFormatted ?? price}</Text>
          </View>
        ) : null}
        <View className="flex-1">
          <Button
            title={added ? 'Añadido a la cesta' : 'Añadir a la cesta'}
            icon={ShoppingBag}
            disabled={needsChoice || unavailable}
            onPress={addLine}
          />
        </View>
      </View>
    </Screen>
  )
}
