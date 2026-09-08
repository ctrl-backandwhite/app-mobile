import { useInfiniteQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ReactElement } from 'react'
import { ActivityIndicator, FlatList, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Screen } from '@ds/components/Screen'
import { EmptyState, ProductCard, ProductCardSkeleton } from '@features/catalog/presentation/components'
import { ProductSummary } from '@features/catalog/domain/entities/product'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

import { FavoriteButton } from '../components/FavoriteButton'

const PAGE_SIZE = 20

/**
 * Los productos guardados.
 *
 * <p>Existe porque el corazón estaba a medias: se podía marcar un producto desde la tarjeta y desde la
 * ficha, pero no había dónde ver lo marcado. Guardar algo que luego no se puede encontrar no es
 * guardar, y en una tienda la lista de deseos es media decisión de compra.
 *
 * <p>Se pide la lista COMPLETA al servidor, no los identificadores para luego pedir una ficha por cada
 * uno: eso serían N llamadas para pintar una pantalla. El almacén de identificadores sigue existiendo
 * para otra cosa —pintar el corazón de cada tarjeta del catálogo— y son lecturas distintas a propósito.
 *
 * <p>El corazón se deja en cada tarjeta también aquí, y eso es deliberado: quitar algo de la lista se
 * hace desde donde se está mirando. La tarjeta desaparece en la siguiente lectura.
 */
export function FavoritesScreen(): ReactElement {
  const { listFavorites } = useContainer()
  const locale = useSessionStore((state) => state.locale)

  const favoritos = useInfiniteQuery({
    queryKey: ['favorites', locale],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const result = await listFavorites.execute({ page: pageParam, size: PAGE_SIZE, lang: locale })
      if (!result.ok) throw result.error
      return result.value
    },
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  })

  const items: ProductSummary[] = favoritos.data?.pages.flatMap((page) => [...page.items]) ?? []

  function openProduct(product: ProductSummary): void {
    router.push(`/product/${product.slug}`)
  }

  if (favoritos.isLoading) {
    return (
      <Screen padded={false}>
        <View className="flex-row flex-wrap gap-3 p-5">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      </Screen>
    )
  }

  if (favoritos.isError) {
    return (
      <Screen>
        <EmptyState
          title="No se han podido cargar tus guardados"
          message="Comprueba tu conexión e inténtalo de nuevo."
          actionLabel="Reintentar"
          onAction={() => void favoritos.refetch()}
        />
      </Screen>
    )
  }

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="Todavía no has guardado nada"
          message="Toca el corazón de un producto para tenerlo aquí a mano."
          actionLabel="Ver el catálogo"
          onAction={() => router.push('/catalog')}
        />
      </Screen>
    )
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperClassName="gap-3 px-5"
        contentContainerClassName="gap-3 py-4"
        showsVerticalScrollIndicator={false}
        // Deslizar hacia abajo para actualizar: es el gesto que se espera en una lista de móvil, y aquí
        // hace falta de verdad porque lo guardado puede cambiar desde otra pantalla o desde la web.
        refreshing={favoritos.isRefetching}
        onRefresh={() => void favoritos.refetch()}
        renderItem={({ item }) => (
          <View className="flex-1">
            <ProductCard product={item} onPress={openProduct} overlay={<FavoriteButton productId={item.id} />} />
          </View>
        )}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (favoritos.hasNextPage && !favoritos.isFetchingNextPage) void favoritos.fetchNextPage()
        }}
        ListFooterComponent={
          favoritos.isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
    </Screen>
  )
}
