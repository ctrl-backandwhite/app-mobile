import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Plus, WalletMinimal } from 'lucide-react-native'
import { ReactElement } from 'react'
import { FlatList, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Button, Icon, Screen, Spinner, Text } from '@ds/components'
import { EmptyState } from '@features/catalog/presentation/components'
import {
  labelOf,
  WalletTransaction,
} from '@features/checkout/domain/entities/wallet-transaction'

/**
 * El monedero: cuánto hay y en qué se ha ido.
 *
 * <p>No es una pantalla informativa de adorno. En esta plataforma se paga con monedero, así que
 * cuando un pedido no sale el primer sitio al que se mira es este; sin histórico, «me han cobrado
 * dos veces» no se puede ni comprobar ni desmentir.
 *
 * <p>Los dos importes NO están en la misma moneda a propósito y por eso se dicen: el saldo lo
 * convierte el servidor a la divisa de quien mira, y los apuntes van en dólares, que es la unidad en
 * la que el monedero lleva su cuenta. Enseñarlos como si fueran lo mismo daría un histórico que no
 * suma hasta el saldo.
 */
export function WalletScreen(): ReactElement {
  const { getWalletBalance, listWalletTransactions } = useContainer()

  const saldo = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const result = await getWalletBalance.execute()
      if (!result.ok) throw result.error
      return result.value
    },
  })

  const movimientos = useInfiniteQuery({
    queryKey: ['wallet-transactions'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const result = await listWalletTransactions.execute(pageParam)
      if (!result.ok) throw result.error
      return result.value
    },
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  })

  const apuntes: WalletTransaction[] = movimientos.data?.pages.flatMap((p) => [...p.items]) ?? []

  /*
    El saldo va sobre el cobalto de la marca y no sobre una tarjeta blanca más: es dinero propio, la
    única cifra de la aplicación que no depende de ningún catálogo, y en el gris de fondo se perdía
    entre los movimientos que tiene justo debajo.
  */
  const cabecera = (
    <View className="gap-4 pb-2">
      <View className="gap-1 rounded-box bg-primary p-5">
        <View className="flex-row items-center gap-2">
          <Icon glyph={WalletMinimal} size="md" tone="inverse" />
          <Text variant="eyebrow" tone="inverse">
            Saldo disponible
          </Text>
        </View>
        {saldo.isLoading ? (
          <Spinner size="sm" testID="cargando-saldo" className="mt-2 self-start" />
        ) : (
          <Text testID="saldo" variant="display" tone="inverse" className="mt-1">
            {saldo.data?.balanceFormatted ?? '—'}
          </Text>
        )}
        {saldo.data?.holdFormatted ? (
          <Text variant="caption" tone="inverse" className="mt-1 opacity-80">
            {`Retenido por operaciones en curso: ${saldo.data.holdFormatted}`}
          </Text>
        ) : null}

        <View className="mt-4">
          <Button
            testID="ir-a-recargar"
            title="Recargar"
            icon={Plus}
            variant="outline"
            onPress={(): void => router.push('/wallet-recharge')}
          />
        </View>
      </View>

      <Text variant="heading">Movimientos</Text>
    </View>
  )

  if (movimientos.isError) {
    return (
      <Screen>
        <EmptyState
          title="No se ha podido cargar tu monedero"
          message="Comprueba tu conexión e inténtalo de nuevo."
          actionLabel="Reintentar"
          onAction={(): void => void movimientos.refetch()}
        />
      </Screen>
    )
  }

  return (
    <Screen padded={false}>
      <FlatList
        testID="movimientos"
        data={apuntes}
        keyExtractor={(item): string => item.id}
        contentContainerClassName="gap-2 p-5"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={cabecera}
        refreshing={movimientos.isRefetching}
        onRefresh={(): void => {
          void movimientos.refetch()
          void saldo.refetch()
        }}
        renderItem={({ item, index }): ReactElement => (
          <Apunte movimiento={item} ultimo={index === apuntes.length - 1} />
        )}
        onEndReachedThreshold={0.5}
        onEndReached={(): void => {
          if (movimientos.hasNextPage && !movimientos.isFetchingNextPage) {
            void movimientos.fetchNextPage()
          }
        }}
        ListEmptyComponent={
          movimientos.isLoading ? (
            <Spinner testID="cargando-movimientos" className="py-6" />
          ) : (
            <Text variant="label" tone="muted" className="py-6 text-center">
              Todavía no hay movimientos.
            </Text>
          )
        }
        ListFooterComponent={
          movimientos.isFetchingNextPage ? (
            <Spinner className="py-4" />
          ) : null
        }
      />
    </Screen>
  )
}

/**
 * Una línea del histórico. El importe va a la derecha y con color: en una lista de movimientos lo
 * primero que se busca es si entró o salió dinero, y el signo solo es difícil de ver.
 */
function Apunte({
  movimiento,
  ultimo,
}: {
  movimiento: WalletTransaction
  ultimo: boolean
}): ReactElement {
  return (
    <View
      testID={`movimiento-${movimiento.id}`}
      className={`flex-row items-center justify-between py-3 ${
        ultimo ? '' : 'border-b border-base-200'
      }`}
    >
      <View className="flex-1 pr-3">
        <Text variant="label">{labelOf(movimiento.kind)}</Text>
        {movimiento.description ? (
          <Text variant="caption" tone="muted" className="mt-0.5" numberOfLines={2}>
            {movimiento.description}
          </Text>
        ) : null}
      </View>
      <View className="items-end">
        <Text
          variant="label"
          tone={movimiento.esEntrada ? 'success' : 'default'}
        >
          {movimiento.amountFormatted}
        </Text>
        <Text variant="caption" tone="muted" className="mt-0.5">
          {movimiento.balanceAfterFormatted}
        </Text>
      </View>
    </View>
  )
}
