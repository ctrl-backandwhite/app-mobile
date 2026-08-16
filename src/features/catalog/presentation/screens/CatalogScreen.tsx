import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { ReactElement, useState } from 'react'
import { ActivityIndicator, FlatList, Text, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Screen } from '@ds/components'
import { ProductSummary } from '@features/catalog/domain/entities/product'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

import { CategoryChips, EmptyState, ProductCard, ProductCardSkeleton, SearchBar } from '../components'

const PAGE_SIZE = 24

/**
 * Listado del catálogo con búsqueda y filtro por categoría.
 *
 * La paginación es infinita porque en un móvil pasar páginas a mano es incómodo; se pide la
 * siguiente al acercarse al final. El término de búsqueda solo se aplica al enviar, no en cada
 * pulsación: buscar en cada letra dispara una petición por carácter y hace parpadear la lista.
 */
export function CatalogScreen(): ReactElement {
  const { browseProducts, listCategories } = useContainer()
  const locale = useSessionStore((state) => state.locale)
  const params = useLocalSearchParams<{ categoryId?: string }>()

  const [term, setTerm] = useState('')
  const [submittedTerm, setSubmittedTerm] = useState('')
  const [categoryId, setCategoryId] = useState<string | undefined>(params.categoryId)

  const categories = useQuery({
    queryKey: ['categories', locale],
    queryFn: async () => {
      const result = await listCategories.execute(locale)
      if (!result.ok) throw result.error
      return result.value
    },
    staleTime: 1000 * 60 * 30,
  })

  const products = useInfiniteQuery({
    queryKey: ['products', locale, submittedTerm, categoryId],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const result = await browseProducts.execute({
        page: pageParam,
        size: PAGE_SIZE,
        lang: locale,
        filters: { q: submittedTerm || undefined, categoryId },
      })
      if (!result.ok) throw result.error
      return result.value
    },
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  })

  const items: ProductSummary[] = products.data?.pages.flatMap((page) => [...page.items]) ?? []

  function openProduct(product: ProductSummary): void {
    router.push(`/product/${product.slug}`)
  }

  return (
    <Screen padded={false}>
      <View className="gap-3 px-5 pt-4">
        <SearchBar
          value={term}
          onChangeText={setTerm}
          onSubmit={() => setSubmittedTerm(term.trim())}
          placeholder="Buscar en el catálogo"
        />
        {categories.data && categories.data.length > 0 ? (
          <CategoryChips
            categories={categories.data.map((category) => ({ id: category.id, name: category.name }))}
            selectedId={categoryId}
            // Volver a pulsar la categoría activa la quita: es la forma natural de deshacer el
            // filtro sin buscar un botón aparte.
            onSelect={(id) => setCategoryId((current) => (current === id ? undefined : id))}
          />
        ) : null}
      </View>

      {products.isLoading ? (
        <View className="flex-row flex-wrap gap-3 p-5">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      ) : products.isError ? (
        <View className="p-5">
          <EmptyState
            title="No se ha podido cargar el catálogo"
            message="Comprueba tu conexión e inténtalo de nuevo."
            actionLabel="Reintentar"
            onAction={() => void products.refetch()}
          />
        </View>
      ) : items.length === 0 ? (
        <View className="p-5">
          <EmptyState
            title="Sin resultados"
            message={
              submittedTerm
                ? `No hay productos para «${submittedTerm}».`
                : 'No hay productos en esta categoría.'
            }
            actionLabel={submittedTerm ? 'Limpiar búsqueda' : undefined}
            onAction={
              submittedTerm
                ? () => {
                    setTerm('')
                    setSubmittedTerm('')
                  }
                : undefined
            }
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperClassName="gap-3 px-5"
          contentContainerClassName="gap-3 py-4"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="flex-1">
              <ProductCard product={item} onPress={openProduct} />
            </View>
          )}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (products.hasNextPage && !products.isFetchingNextPage) void products.fetchNextPage()
          }}
          ListFooterComponent={
            products.isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator />
              </View>
            ) : items.length > 0 && !products.hasNextPage ? (
              <Text className="py-4 text-center text-[12px] text-base-content opacity-60">
                No hay más productos
              </Text>
            ) : null
          }
        />
      )}
    </Screen>
  )
}
