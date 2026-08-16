import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { ReactElement, useMemo, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Alert, Button, Screen } from '@ds/components'
import { useSessionStore } from '@features/auth/presentation/state/session.store'
import {
  imagesFor,
  isSelectionComplete,
  priceTierFor,
  variantFor,
  VariantSelection,
} from '@features/catalog/domain/entities/product-detail'
import { FavoriteButton } from '@features/favorites/presentation/components/FavoriteButton'

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
  const { getProductDetail, listReviews, listRelatedProducts } = useContainer()
  const locale = useSessionStore((state) => state.locale)
  const { slug } = useLocalSearchParams<{ slug: string }>()

  const [selection, setSelection] = useState<VariantSelection>({})
  const [quantity, setQuantity] = useState(1)

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
      <Screen>
        <Text className="py-8 text-center text-[13px] text-base-content opacity-60">Cargando…</Text>
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

  return (
    <Screen padded={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        <View>
          <ProductGallery images={images} videoUrl={product.videoUrl} />
          <View className="absolute right-4 top-4">
            <FavoriteButton productId={product.id} size={24} />
          </View>
        </View>

        <View className="gap-5 p-5">
          <View className="gap-2">
            <Text className="text-[17px] leading-[24px] text-base-content">{product.title}</Text>
            {price ? (
              <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
                <Text className="font-medium text-[24px] text-base-content">{price}</Text>
                {previousPrice ? (
                  <Text className="text-[14px] text-error line-through">{previousPrice}</Text>
                ) : null}
              </View>
            ) : null}
            {product.brand ? (
              <Text className="text-[12px] text-base-content opacity-70">{product.brand}</Text>
            ) : null}
            {product.moq > 1 ? (
              <Text className="text-[12px] text-base-content opacity-70">
                Pedido mínimo: {product.moq} unidades
              </Text>
            ) : null}
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
            <Text className="text-[13px] text-base-content opacity-80">Cantidad</Text>
            <QuantityStepper value={quantity} min={product.moq} onChange={setQuantity} />
          </View>

          <PriceTierTable tiers={product.priceTiers} highlighted={tier} />

          {needsChoice ? (
            <Alert variant="info" message="Elige todas las opciones para continuar." />
          ) : null}

          <Button
            title="Añadir a la cesta"
            disabled={needsChoice}
            onPress={() => {
              // La cesta llega en la fase siguiente; hasta entonces el botón queda visible pero
              // inerte para no prometer algo que todavía no ocurre.
            }}
          />

          {product.description ? (
            <View className="gap-2">
              <Text className="font-medium text-[15px] text-base-content">Descripción</Text>
              <Text className="text-[13px] leading-[20px] text-base-content opacity-90">
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
    </Screen>
  )
}
