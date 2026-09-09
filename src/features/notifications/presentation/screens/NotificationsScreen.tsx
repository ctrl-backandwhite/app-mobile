import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ReactElement, useState } from 'react'
import { FlatList, Pressable, Switch, Text, View } from 'react-native'

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
  const {
    listNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    archiveNotification,
    enablePushNotifications,
  } = useContainer()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [avisosEnElMovil, setAvisosEnElMovil] = useState(false)

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

  /**
   * El permiso se pide AQUÍ y no al arrancar. Un diálogo de permisos en el primer segundo se deniega
   * casi siempre —no se ha visto todavía para qué sirve— y en iOS solo se puede preguntar una vez.
   * Pedido desde la pantalla de avisos, quien lo activa ya sabe qué está activando.
   */
  const activarEnElMovil = useMutation({
    mutationFn: async () => {
      const result = await enablePushNotifications.execute()
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (activado) => {
      setAvisosEnElMovil(activado)
      // Que no se active es un caso NORMAL —permiso denegado, o un teléfono sin los servicios de
      // mensajería, como un emulador—, así que el aviso dice qué mirar en vez de invitar a volver a
      // pulsar: el caso de uso colapsa todas las causas en «no» a propósito y aquí no se sabe cuál
      // fue. «No se han podido activar» a secas se leía como un fallo pasajero que se arregla
      // insistiendo, y no lo es.
      setError(
        activado
          ? null
          : 'No hemos podido activarlos. Revisa que la aplicación tenga permiso para enviar avisos ' +
              'en los ajustes del teléfono; hay dispositivos que no pueden recibirlos. Los avisos ' +
              'siguen apareciendo aquí de todas formas.',
      )
    },
    onError: falla,
  })

  const items = avisos.data ?? []
  const sinLeer = unreadCountOf(items)

  /**
   * El interruptor va SIEMPRE visible, también con la bandeja vacía: quien todavía no ha recibido
   * ningún aviso es justo quien más necesita poder activarlos, y esconderlo tras tener avisos sería
   * pedir que ocurra lo que se quiere que avise.
   */
  const interruptorDeAvisos = (
    <View
      className="flex-row items-center justify-between rounded-box border border-base-300 bg-base-100 p-3"
    >
      <View className="flex-1 pr-3">
        <Text className="font-medium text-[14px] text-base-content">Avisos en el móvil</Text>
        <Text className="mt-0.5 text-[12px] text-base-content opacity-60">
          Recibe un aviso cuando cambie el estado de un pedido.
        </Text>
      </View>
      <Switch
        testID="avisos-en-el-movil"
        accessibilityLabel="Recibir avisos en este dispositivo"
        value={avisosEnElMovil}
        disabled={activarEnElMovil.isPending}
        onValueChange={(): void => activarEnElMovil.mutate()}
      />
    </View>
  )

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
        {interruptorDeAvisos}
        {error ? (
          <View className="mt-3">
            <Alert variant="error" message={error} />
          </View>
        ) : null}
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
            {interruptorDeAvisos}
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
