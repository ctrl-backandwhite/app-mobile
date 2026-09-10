import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Receipt } from 'lucide-react-native'
import { ReactElement } from 'react'
import { FlatList, View } from 'react-native'

import { Screen, Skeleton, Text } from '@ds/components'
import { EmptyState } from '@features/catalog/presentation/components'
import { Order } from '@features/orders/domain/entities/order'

import { OrderCard } from '../components'
import { useOrdersUseCases } from '../hooks/use-orders-use-cases'

/**
 * Histórico de pedidos.
 *
 * El backend devuelve la lista entera y ya ordenada, así que aquí no hay paginación ni criterio de
 * orden propio: quien compra dos veces al mes no llena una pantalla, y reordenar en el cliente
 * abriría la puerta a que la app y el panel web enseñaran secuencias distintas.
 */
export function OrdersScreen(): ReactElement {
  const { listOrders } = useOrdersUseCases()

  const orders = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const result = await listOrders.execute()
      if (!result.ok) throw result.error
      return result.value
    },
  })

  const items = orders.data ?? []

  function openOrder(order: Order): void {
    router.push(`/orders/${order.id}`)
  }

  if (orders.isLoading) {
    return (
      <Screen>
        <View className="gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </View>
      </Screen>
    )
  }

  if (orders.isError) {
    return (
      <Screen>
        <EmptyState
          title="No se ha podido cargar tu histórico"
          message="Comprueba tu conexión e inténtalo de nuevo."
          actionLabel="Reintentar"
          onAction={(): void => void orders.refetch()}
        />
      </Screen>
    )
  }

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon={Receipt}
          title="Todavía no has hecho ningún pedido"
          message="Cuando hagas tu primera compra, aparecerá aquí."
          actionLabel="Ver el catálogo"
          onAction={(): void => router.push('/(app)/(tabs)/catalog')}
        />
      </Screen>
    )
  }

  return (
    <Screen padded={false} scroll={false}>
      <FlatList
        data={items}
        keyExtractor={(item): string => item.id}
        contentContainerClassName="gap-3 p-5"
        showsVerticalScrollIndicator={false}
        // Deslizar para actualizar: el estado de un pedido cambia por su cuenta —lo cambia el
        // almacén— y sin el gesto la única forma de enterarse era salir de la pantalla y volver.
        refreshing={orders.isRefetching}
        onRefresh={(): void => void orders.refetch()}
        ListHeaderComponent={
          <Text variant="caption" tone="muted" className="pb-2">
            {items.length === 1 ? '1 pedido' : `${items.length} pedidos`}
          </Text>
        }
        renderItem={({ item }): ReactElement => <OrderCard order={item} onPress={openOrder} />}
      />
    </Screen>
  )
}
