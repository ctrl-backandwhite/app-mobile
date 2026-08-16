import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ReactElement } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Screen } from '@ds/components'
import { ProductSummary } from '@features/catalog/domain/entities/product'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

import { CategoryChips, EmptyState, ProductCardSkeleton, SectionRow } from '../components'

/**
 * Portada del catálogo.
 *
 * Las secciones las compone el backend —con sus títulos ya traducidos—, así que la pantalla no
 * decide qué mostrar ni en qué orden: solo pinta lo que llega. Añadir una sección nueva es un cambio
 * de servidor, sin publicar versión de la app.
 */
export function StorefrontScreen(): ReactElement {
  const { loadHome } = useContainer()
  const locale = useSessionStore((state) => state.locale)

  const { data, isLoading, isError, refetch } = useQuery({
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

  if (isLoading) {
    return (
      <Screen padded={false}>
        <View className="gap-4 p-5">
          <Text className="font-medium text-[20px] text-base-content">Descubre</Text>
          <View className="flex-row gap-3">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </View>
        </View>
      </Screen>
    )
  }

  if (isError || !data) {
    return (
      <Screen>
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
    <Screen padded={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-8">
        <View className="gap-1 px-5 pt-4">
          <Text className="font-medium text-[22px] text-base-content">Descubre</Text>
          <Text className="text-[13px] text-base-content opacity-70">
            {data.totalProducts.toLocaleString(locale)} productos listos para revender
          </Text>
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
            <View key={section.code} className="mt-6">
              <SectionRow
                title={section.title}
                products={[...section.items]}
                onSelect={openProduct}
                onSeeAll={() => router.push('/(app)/(tabs)/catalog')}
              />
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  )
}

/** Indicador de carga reutilizable por las pantallas del catálogo. */
export function CatalogSpinner(): ReactElement {
  return (
    <View className="items-center justify-center py-8">
      <ActivityIndicator />
    </View>
  )
}
