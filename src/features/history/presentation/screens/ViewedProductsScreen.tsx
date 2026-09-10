import { useInfiniteQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { History } from 'lucide-react-native'
import { ReactElement } from 'react'
import { FlatList, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Screen, Spinner, Text } from '@ds/components'
import { useSessionStore } from '@features/auth/presentation/state/session.store'
import { ProductSummary } from '@features/catalog/domain/entities/product'
import { EmptyState, ProductCard, ProductCardSkeleton } from '@features/catalog/presentation/components'
import { FavoriteButton } from '@features/favorites/presentation/components/FavoriteButton'

const PAGE_SIZE = 20

/**
 * Lo que has visto: las fichas abiertas, de la más reciente a la más antigua.
 *
 * <p>En una tienda casi nadie compra en la primera visita. Sin este rastro, volver a un producto que
 * se miró ayer obligaba a recordar cómo se encontró y repetir la búsqueda; con él, seguir donde se
 * dejó es un toque. Es además la misma lista que alimenta el correo de recordatorio, así que lo que
 * llega por correo y lo que se ve aquí no pueden discrepar.
 *
 * <p>Lleva el corazón en cada tarjeta a propósito: mirar dos veces algo es justo el momento en el que
 * apetece guardarlo, y tener que abrir la ficha para marcarlo rompía ese impulso.
 */
export function ViewedProductsScreen(): ReactElement {
  const { listViewedProducts } = useContainer()
  const locale = useSessionStore((state) => state.locale)

  const historial = useInfiniteQuery({
    queryKey: ['product-views', locale],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const result = await listViewedProducts.execute({ page: pageParam, size: PAGE_SIZE, lang: locale })
      if (!result.ok) throw result.error
      return result.value
    },
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  })

  const items: ProductSummary[] = historial.data?.pages.flatMap((page) => [...page.items]) ?? []

  function openProduct(product: ProductSummary): void {
    router.push(`/product/${product.slug}`)
  }

  if (historial.isLoading) {
    return (
      <Screen padded={false}>
        <View className="flex-row flex-wrap gap-3 p-5">
          <View className="flex-1">
            <ProductCardSkeleton />
          </View>
          <View className="flex-1">
            <ProductCardSkeleton />
          </View>
        </View>
      </Screen>
    )
  }

  if (historial.isError) {
    return (
      <Screen>
        <EmptyState
          title="No se ha podido cargar tu historial"
          message="Comprueba tu conexión e inténtalo de nuevo."
          actionLabel="Reintentar"
          onAction={(): void => void historial.refetch()}
        />
      </Screen>
    )
  }

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon={History}
          title="Todavía no has visto ningún producto"
          message="Las fichas que abras aparecerán aquí para que puedas volver a ellas."
          actionLabel="Ver el catálogo"
          onAction={(): void => router.push('/(app)/(tabs)/catalog')}
        />
      </Screen>
    )
  }

  return (
    <Screen padded={false} scroll={false}>
      <FlatList
        testID="historial-de-visitas"
        data={items}
        keyExtractor={(item): string => item.id}
        numColumns={2}
        columnWrapperClassName="gap-3 px-5"
        contentContainerClassName="gap-3 py-4"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="px-5 pb-1">
            <Text variant="caption" tone="muted">
              {items.length === 1 ? '1 producto' : `${items.length} productos`}
            </Text>
          </View>
        }
        refreshing={historial.isRefetching}
        onRefresh={(): void => void historial.refetch()}
        renderItem={({ item }): ReactElement => (
          // `max-w-[50%]`: en una fila incompleta, `flex-1` estiraba la tarjeta a todo el ancho y la
          // rejilla se deshacía justo donde más se nota.
          <View className="max-w-[50%] flex-1">
            <ProductCard
              product={item}
              onPress={openProduct}
              overlay={<FavoriteButton productId={item.id} />}
            />
          </View>
        )}
        onEndReachedThreshold={0.5}
        onEndReached={(): void => {
          if (historial.hasNextPage && !historial.isFetchingNextPage) void historial.fetchNextPage()
        }}
        ListFooterComponent={historial.isFetchingNextPage ? <Spinner className="py-4" /> : null}
      />
    </Screen>
  )
}
