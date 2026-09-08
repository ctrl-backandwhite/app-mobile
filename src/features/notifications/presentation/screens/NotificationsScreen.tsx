import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ReactElement, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Alert, Screen } from '@ds/components'
import { EmptyState } from '@features/catalog/presentation/components'
import {
  PlatformNotification,
  unreadCountOf,
} from '@features/notifications/domain/entities/notification'

/**
 * El buzón de avisos de la plataforma.
 *
 * <p>Es el buzón DENTRO de la aplicación, no un aviso del sistema operativo: aquí llegan los cambios
 * de estado de un pedido, los avisos de facturación y lo que la plataforma quiera contar. Los push
 * nativos necesitan además que el servidor guarde el identificador del dispositivo, y eso todavía no
 * existe en el backend.
 *
 * <p>Tocar un aviso lo marca como leído. No hay botón de «marcar leído» por fila a propósito: leerlo
 * ES abrirlo, y un botón aparte sería pedir dos gestos para una sola intención.
 */
export function NotificationsScreen(): ReactElement {
  const { listNotifications, markNotificationRead, markAllNotificationsRead, archiveNotification } =
    useContainer()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const avisos = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const result = await listNotifications.execute()
      if (!result.ok) throw result.error
      return result.value
    },
  })

  function recarga(): void {
    setError(null)
    void queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  /**
   * Marcar y archivar cambian la lista. Si el servidor los rechaza y no se dice nada, el aviso se
   * queda como estaba y parece que la app ignora los toques: hay que contarlo.
   */
  function falla(e: Error): void {
    setError(e.message)
  }

  const leer = useMutation({
    mutationFn: async (id: string) => {
      const result = await markNotificationRead.execute(id)
      if (!result.ok) throw result.error
    },
    onSuccess: recarga,
    onError: falla,
  })

  const leerTodo = useMutation({
    mutationFn: async () => {
      const result = await markAllNotificationsRead.execute()
      if (!result.ok) throw result.error
    },
    onSuccess: recarga,
    onError: falla,
  })

  const archivar = useMutation({
    mutationFn: async (id: string) => {
      const result = await archiveNotification.execute(id)
      if (!result.ok) throw result.error
    },
    onSuccess: recarga,
    onError: falla,
  })

  const items = avisos.data ?? []
  const sinLeer = unreadCountOf(items)

  if (avisos.isLoading) {
    return (
      <Screen>
        <Text className="py-8 text-center text-[13px] text-base-content opacity-60">Cargando…</Text>
      </Screen>
    )
  }

  if (avisos.isError) {
    return (
      <Screen>
        <EmptyState
          title="No se han podido cargar tus avisos"
          message="Comprueba tu conexión e inténtalo de nuevo."
          actionLabel="Reintentar"
          onAction={(): void => void avisos.refetch()}
        />
      </Screen>
    )
  }

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="No tienes avisos"
          message="Aquí aparecerán los cambios de tus pedidos y los mensajes de la plataforma."
        />
      </Screen>
    )
  }

  return (
    <Screen padded={false}>
      <FlatList
        testID="avisos"
        data={items}
        keyExtractor={(item): string => item.id}
        contentContainerClassName="gap-2 p-5"
        showsVerticalScrollIndicator={false}
        refreshing={avisos.isRefetching}
        onRefresh={(): void => void avisos.refetch()}
        ListHeaderComponent={
          <View className="gap-2 pb-1">
            {error ? <Alert variant="error" message={error} /> : null}
            {sinLeer > 0 ? (
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] text-base-content opacity-70">
                  {sinLeer === 1 ? '1 sin leer' : `${sinLeer} sin leer`}
                </Text>
                <Pressable
                  testID="marcar-todo-leido"
                  accessibilityRole="button"
                  onPress={(): void => leerTodo.mutate()}
                  disabled={leerTodo.isPending}
                  hitSlop={8}
                >
                  <Text className="text-[13px] text-primary">Marcar todo como leído</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }): ReactElement => (
          <Aviso
            aviso={item}
            onLeer={(): void => leer.mutate(item.id)}
            onArchivar={(): void => archivar.mutate(item.id)}
          />
        )}
      />
    </Screen>
  )
}

interface AvisoProps {
  aviso: PlatformNotification
  onLeer: () => void
  onArchivar: () => void
}

/**
 * Lo no leído se distingue por el punto y por el fondo, no solo por el grosor del texto: quien mira
 * la lista de pasada busca «qué hay nuevo», y una negrita a media pantalla no se ve.
 */
function Aviso({ aviso, onLeer, onArchivar }: AvisoProps): ReactElement {
  return (
    <View
      testID={`aviso-${aviso.id}`}
      className={`rounded-box border p-3 ${
        aviso.read ? 'border-base-300 bg-base-100' : 'border-primary/30 bg-primary/[0.06]'
      }`}
    >
      <Pressable
        testID={`abrir-aviso-${aviso.id}`}
        accessibilityRole="button"
        accessibilityLabel={aviso.read ? aviso.title : `${aviso.title}, sin leer`}
        onPress={aviso.read ? undefined : onLeer}
        disabled={aviso.read}
      >
        <View className="flex-row items-center gap-2">
          {aviso.read ? null : <View testID={`sin-leer-${aviso.id}`} className="h-2 w-2 rounded-full bg-primary" />}
          <Text className="flex-1 font-medium text-[14px] text-base-content">{aviso.title}</Text>
        </View>
        {aviso.body.length > 0 ? (
          <Text className="mt-1 text-[13px] text-base-content opacity-75">{aviso.body}</Text>
        ) : null}
      </Pressable>

      <View className="mt-2 flex-row justify-end">
        <Pressable
          testID={`archivar-${aviso.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Archivar ${aviso.title}`}
          onPress={onArchivar}
          hitSlop={8}
        >
          <Text className="text-[12px] text-base-content opacity-60">Archivar</Text>
        </Pressable>
      </View>
    </View>
  )
}
