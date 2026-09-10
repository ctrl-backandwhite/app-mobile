import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { SlidersHorizontal } from 'lucide-react-native'
import { ReactElement, useState } from 'react'
import { FlatList, Pressable, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Alert, Badge, Icon, Screen, Spinner, Text } from '@ds/components'
import { ProductFilters } from '@features/catalog/domain/entities/filters'
import { ProductSummary } from '@features/catalog/domain/entities/product'
import { useSessionStore } from '@features/auth/presentation/state/session.store'
import { useQuickAdd } from '@features/cart/presentation/hooks/use-quick-add'
import { FavoriteButton } from '@features/favorites/presentation/components/FavoriteButton'

import {
  CategoryChips,
  EmptyState,
  FilterSheet,
  ProductCard,
  ProductCardSkeleton,
  SearchBar,
} from '../components'

const PAGE_SIZE = 24

/**
 * Cuántos criterios hay puestos, sin contar el orden.
 *
 * El orden siempre tiene un valor —«mejor coincidencia» es uno— así que contarlo dejaría el aviso
 * encendido para siempre y dejaría de significar nada.
 */
function countFilters(filters: ProductFilters): number {
  return [filters.minPrice, filters.maxPrice, filters.hasVideo, filters.minRating].filter(
    (value) => value !== undefined,
  ).length
}

/**
 * Listado del catálogo con búsqueda, orden y filtros.
 *
 * La paginación es infinita porque en un móvil pasar páginas a mano es incómodo; se pide la
 * siguiente al acercarse al final. El término de búsqueda solo se aplica al enviar, no en cada
 * pulsación: buscar en cada letra dispara una petición por carácter y hace parpadear la lista.
 */
export function CatalogScreen(): ReactElement {
  const { browseProducts, listCategories } = useContainer()
  const locale = useSessionStore((state) => state.locale)
  const params = useLocalSearchParams<{ categoryId?: string; q?: string }>()

  // La portada busca y trae aquí el término: sin esto, escribir arriba llevaba a un catálogo vacío
  // de contexto y había que volver a teclearlo.
  const [term, setTerm] = useState(params.q ?? '')
  const [submittedTerm, setSubmittedTerm] = useState(params.q ?? '')
  const [categoryId, setCategoryId] = useState<string | undefined>(params.categoryId)
  const [filters, setFilters] = useState<ProductFilters>({})
  const [sheetOpen, setSheetOpen] = useState(false)
  const { add, addedId, error: addError } = useQuickAdd()

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
    queryKey: ['products', locale, submittedTerm, categoryId, filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const result = await browseProducts.execute({
        page: pageParam,
        size: PAGE_SIZE,
        lang: locale,
        filters: { ...filters, q: submittedTerm || undefined, categoryId },
      })
      if (!result.ok) throw result.error
      return result.value
    },
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  })

  const items: ProductSummary[] = products.data?.pages.flatMap((page) => [...page.items]) ?? []
  const total = products.data?.pages[0]?.totalElements
  const active = countFilters(filters)

  function openProduct(product: ProductSummary): void {
    router.push(`/product/${product.slug}`)
  }

  function clearSearch(): void {
    setTerm('')
    setSubmittedTerm('')
  }

  return (
    <Screen padded={false} edges={['top']}>
      <View className="gap-3 pt-4">
        <View className="flex-row items-center gap-2 px-5">
          <View className="flex-1">
            <SearchBar
              value={term}
              onChangeText={setTerm}
              onSubmit={() => setSubmittedTerm(term.trim())}
              placeholder="Buscar en el catálogo"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              active > 0 ? `Ordenar y filtrar, ${active} filtros aplicados` : 'Ordenar y filtrar'
            }
            onPress={() => setSheetOpen(true)}
            testID="abrir-filtros"
            className="h-12 w-12 items-center justify-center rounded-field border border-base-300 bg-base-100 active:opacity-80"
          >
            <Icon glyph={SlidersHorizontal} size="lg" tone={active > 0 ? 'primary' : 'default'} />
            {/* La cuenta va sobre el botón: si el filtro está puesto y no se ve, los resultados
                parecen un fallo del catálogo. */}
            {active > 0 ? (
              <View className="absolute -right-1 -top-1">
                <Badge tone="primary" label={String(active)} />
              </View>
            ) : null}
          </Pressable>
        </View>

        {categories.data && categories.data.length > 0 ? (
          <CategoryChips
            categories={categories.data.map((category) => ({ id: category.id, name: category.name }))}
            selectedId={categoryId}
            // Volver a pulsar la categoría activa la quita: es la forma natural de deshacer el
            // filtro sin buscar un botón aparte.
            onSelect={(id) => setCategoryId((current) => (current === id ? undefined : id))}
          />
        ) : null}

        {addError ? (
          <View className="px-5">
            <Alert variant="warning" message={addError} />
          </View>
        ) : null}

        {total != null && items.length > 0 ? (
          <Text variant="caption" tone="muted" className="px-5">
            {total.toLocaleString(locale)} productos
            {submittedTerm ? ` para «${submittedTerm}»` : ''}
          </Text>
        ) : null}
      </View>

      {products.isLoading ? (
        <View className="flex-row flex-wrap gap-3 p-5">
          <View className="flex-1">
            <ProductCardSkeleton />
          </View>
          <View className="flex-1">
            <ProductCardSkeleton />
          </View>
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
                : active > 0
                  ? 'Ningún producto cumple los filtros que has puesto.'
                  : 'No hay productos en esta categoría.'
            }
            actionLabel={submittedTerm ? 'Limpiar búsqueda' : active > 0 ? 'Quitar filtros' : undefined}
            onAction={
              submittedTerm ? clearSearch : active > 0 ? () => setFilters({}) : undefined
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
          // El catálogo se mueve: entran referencias y cambian precios. Deslizar hacia abajo es el
          // gesto que se espera en una tienda para pedir lo último.
          refreshing={products.isRefetching && !products.isFetchingNextPage}
          onRefresh={(): void => void products.refetch()}
          renderItem={({ item }) => (
            // Acotado al medio ancho: la última fila impar dejaría si no una tarjeta gigante.
            <View className="max-w-[50%] flex-1">
              <ProductCard
                product={item}
                onPress={openProduct}
                onAdd={add}
                added={addedId === item.id}
                overlay={<FavoriteButton productId={item.id} />}
              />
            </View>
          )}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (products.hasNextPage && !products.isFetchingNextPage) void products.fetchNextPage()
          }}
          ListFooterComponent={
            products.isFetchingNextPage ? (
              <Spinner className="py-4" />
            ) : items.length > 0 && !products.hasNextPage ? (
              <Text variant="caption" tone="muted" className="py-4 text-center">
                No hay más productos
              </Text>
            ) : null
          }
        />
      )}

      <FilterSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        value={filters}
        onApply={setFilters}
      />
    </Screen>
  )
}
