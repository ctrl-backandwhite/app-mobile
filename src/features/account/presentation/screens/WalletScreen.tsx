import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ReactElement } from 'react'
import { ActivityIndicator, FlatList, Text, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Card, Screen } from '@ds/components'
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

  const cabecera = (
    <View className="gap-4 pb-2">
      <Card>
        <Text className="text-[13px] text-base-content opacity-70">Saldo disponible</Text>
        {saldo.isLoading ? (
          <ActivityIndicator testID="cargando-saldo" className="mt-2 self-start" />
        ) : (
          <Text testID="saldo" className="mt-1 font-medium text-[30px] text-base-content">
            {saldo.data?.balanceFormatted ?? '—'}
          </Text>
        )}
        {saldo.data?.holdFormatted ? (
          <Text className="mt-1 text-[12px] text-base-content opacity-60">
            {`Retenido por operaciones en curso: ${saldo.data.holdFormatted}`}
          </Text>
        ) : null}
      </Card>

      <Text className="font-medium text-[15px] text-base-content">Movimientos</Text>
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
        renderItem={({ item }): ReactElement => <Apunte movimiento={item} />}
        onEndReachedThreshold={0.5}
        onEndReached={(): void => {
          if (movimientos.hasNextPage && !movimientos.isFetchingNextPage) {
            void movimientos.fetchNextPage()
          }
        }}
        ListEmptyComponent={
          movimientos.isLoading ? (
            <ActivityIndicator testID="cargando-movimientos" />
          ) : (
            <Text className="py-6 text-center text-[13px] text-base-content opacity-60">
              Todavía no hay movimientos.
            </Text>
          )
        }
        ListFooterComponent={
          movimientos.isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator />
            </View>
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
function Apunte({ movimiento }: { movimiento: WalletTransaction }): ReactElement {
  return (
    <View
      testID={`movimiento-${movimiento.id}`}
      className="flex-row items-center justify-between border-b border-base-300 py-3"
    >
      <View className="flex-1 pr-3">
        <Text className="font-medium text-[14px] text-base-content">{labelOf(movimiento.kind)}</Text>
        {movimiento.description ? (
          <Text className="mt-0.5 text-[12px] text-base-content opacity-60" numberOfLines={2}>
            {movimiento.description}
          </Text>
        ) : null}
      </View>
      <View className="items-end">
        <Text
          className={`font-medium text-[14px] ${movimiento.esEntrada ? 'text-success' : 'text-base-content'}`}
        >
          {movimiento.amountFormatted}
        </Text>
        <Text className="mt-0.5 text-[11px] text-base-content opacity-50">
          {movimiento.balanceAfterFormatted}
        </Text>
      </View>
    </View>
  )
}
