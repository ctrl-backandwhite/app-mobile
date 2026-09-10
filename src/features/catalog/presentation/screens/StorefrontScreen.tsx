import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Bell } from 'lucide-react-native'
import { ReactElement, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Alert, Icon, Screen, Text } from '@ds/components'
import { homeSectionTitle } from '@features/catalog/domain/entities/home'
import { ProductSummary } from '@features/catalog/domain/entities/product'
import { useSessionStore } from '@features/auth/presentation/state/session.store'
import { useQuickAdd } from '@features/cart/presentation/hooks/use-quick-add'

import { CategoryChips, EmptyState, ProductCardSkeleton, SearchBar, SectionRow } from '../components'

/**
 * Antetítulo de cada sección: dice POR QUÉ está ahí esa fila.
 *
 * El catálogo se recorre para decidir qué revender, no para curiosear, así que cada bloque declara
 * en qué se apoya —lo que se está vendiendo, lo que acaba de entrar— en lugar de limitarse a un
 * rótulo bonito. Una sección con un código que la aplicación no conoce se pinta sin antetítulo.
 */
const ANTETITULOS: Readonly<Record<string, string>> = {
  trending: 'Demanda al alza',
  newest: 'Recién catalogado',
  video: 'Con vídeo de producto',
  top_selling: 'Ventas comprobadas',
}

/**
 * Portada del catálogo.
 *
 * Las secciones las compone el backend, así que la pantalla no decide qué mostrar ni en qué orden:
 * solo pinta lo que llega. Añadir una sección nueva es un cambio de servidor, sin publicar versión
 * de la app. El TÍTULO sí lo pone la aplicación: el que manda el servidor viene en inglés.
 */
export function StorefrontScreen(): ReactElement {
  const { loadHome } = useContainer()
  const locale = useSessionStore((state) => state.locale)
  const [term, setTerm] = useState('')
  const { add, addedId, error: addError } = useQuickAdd()

  const { data, isLoading, isError, isRefetching, refetch } = useQuery({
    queryKey: ['home', locale],
    queryFn: async () => {
      const result = await loadHome.execute(locale)
      if (!result.ok) throw result.error
      return result.value
    },
    staleTime: 1000 * 60 * 5,
  })

  function openProduct(product: ProductSummary): void {
    router.push(`/product/${product.slug}`)
  }

  /** La búsqueda vive en el catálogo: la portada solo recoge el término y lo lleva allí. */
  function search(): void {
    const query = term.trim()
    if (query.length === 0) return
    router.push(`/(app)/(tabs)/catalog?q=${encodeURIComponent(query)}`)
  }

  /*
   * Sin logotipo: dentro de la aplicación nadie duda de en qué aplicación está, y la marca ya se ve
   * al entrar. La fila que ocupaba se recupera para el catálogo, que es a lo que se viene.
   */
  const header = (
    <View className="flex-row items-center gap-2 px-5 pt-2">
      <View className="flex-1">
        <SearchBar value={term} onChangeText={setTerm} onSubmit={search} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Avisos"
        onPress={() => router.push('/notifications')}
        hitSlop={8}
        className="h-12 w-12 items-center justify-center rounded-full active:bg-base-200"
      >
        <Icon glyph={Bell} size="lg" tone="default" />
      </Pressable>
    </View>
  )

  if (isLoading) {
    return (
      <Screen padded={false} edges={['top']}>
        {header}
        <View className="gap-4 p-5">
          <View className="h-6 w-40 rounded-selector bg-base-300" />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <ProductCardSkeleton />
            </View>
            <View className="flex-1">
              <ProductCardSkeleton />
            </View>
          </View>
        </View>
      </Screen>
    )
  }

  if (isError || !data) {
    return (
      <Screen edges={['top']}>
        <EmptyState
          title="No se ha podido cargar el catálogo"
          message="Comprueba tu conexión e inténtalo de nuevo."
          actionLabel="Reintentar"
          onAction={() => void refetch()}
        />
      </Screen>
    )
  }

  return (
    <Screen padded={false} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
        /*
          Deslizar para actualizar. La portada se guarda cinco minutos, así que sin este gesto quien
          quisiera ver lo último tenía que cerrar la aplicación y volver a abrirla.
        */
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={(): void => void refetch()} />
        }
      >
        {header}

        {addError ? (
          <View className="mt-3 px-5">
            <Alert variant="warning" message={addError} />
          </View>
        ) : null}

        <View className="mt-5 gap-1 px-5">
          <Text variant="eyebrow" tone="muted">
            {data.totalProducts.toLocaleString(locale)} referencias
          </Text>
          <Text variant="display">Qué vender hoy</Text>
        </View>

        {data.hotCategories.length > 0 ? (
          <View className="mt-4">
            <CategoryChips
              categories={data.hotCategories.map((category) => ({
                id: category.id,
                name: category.name,
              }))}
              onSelect={(id) => router.push(`/(app)/(tabs)/catalog?categoryId=${id}`)}
            />
          </View>
        ) : null}

        {data.sections.length === 0 ? (
          <View className="p-5">
            <EmptyState
              title="Aún no hay nada que mostrar"
              message="El catálogo se está preparando. Vuelve en un rato."
            />
          </View>
        ) : (
          data.sections.map((section) => (
            <View key={section.code} className="mt-8">
              <SectionRow
                eyebrow={ANTETITULOS[section.code]}
                title={homeSectionTitle(section)}
                products={[...section.items]}
                onSelect={openProduct}
                onAdd={add}
                addedId={addedId}
                onSeeAll={() => router.push('/(app)/(tabs)/catalog')}
              />
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  )
}
