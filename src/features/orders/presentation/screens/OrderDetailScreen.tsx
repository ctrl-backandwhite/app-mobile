import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { ReactElement, useState } from 'react'
import { Alert, Image, ScrollView, Text, View } from 'react-native'

import { Button, Card, Screen } from '@ds/components'
import { useSessionStore } from '@features/auth/presentation/state/session.store'
import { EmptyState } from '@features/catalog/presentation/components'
import { isCancellable, statusLabel } from '@features/orders/domain/entities/order'
import { OrderAddress, OrderItem } from '@features/orders/domain/entities/order-detail'
import { Shipment } from '@features/orders/domain/entities/tracking'

import { TrackingTimeline } from '../components'
import { useOrdersUseCases } from '../hooks/use-orders-use-cases'
import { formatDate } from '../lib/format-date'

/**
 * Hueco del importe. Ningún renglón del desglose se calcula ni se completa aquí: si el backend no
 * manda un importe formateado se deja el guion, porque un número inventado en la pantalla del
 * pedido contradiría la factura que ya se emitió.
 */
const NO_AMOUNT = '—'

function AmountRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value?: string
  strong?: boolean
}): ReactElement {
  return (
    <View className="flex-row items-center justify-between gap-3 py-1">
      <Text className={`text-[13px] text-base-content ${strong ? 'font-medium' : 'opacity-70'}`}>
        {label}
      </Text>
      <Text
        className={`text-base-content ${strong ? 'font-medium text-[16px]' : 'text-[13px]'} ${
          value ? '' : 'opacity-40'
        }`}
      >
        {value ?? NO_AMOUNT}
      </Text>
    </View>
  )
}

function ItemRow({ item }: { item: OrderItem }): ReactElement {
  return (
    <View testID={`order-item-${item.id}`} className="flex-row gap-3 py-2">
      {item.imageUrl ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: item.imageUrl }}
          resizeMode="cover"
          className="h-14 w-14 rounded-selector bg-base-200"
        />
      ) : (
        <View className="h-14 w-14 rounded-selector bg-base-200" />
      )}
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={2} className="text-[13px] leading-[18px] text-base-content">
          {item.productTitle}
        </Text>
        {item.variantName ? (
          <Text className="text-[11px] text-base-content opacity-60">{item.variantName}</Text>
        ) : null}
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-[12px] text-base-content opacity-70">×{item.quantity}</Text>
          <Text
            className={`text-[13px] text-base-content ${item.lineTotalFormatted ? '' : 'opacity-40'}`}
          >
            {item.lineTotalFormatted ?? NO_AMOUNT}
          </Text>
        </View>
      </View>
    </View>
  )
}

/** Las líneas de la dirección se componen tal y como llegaron: aquí no se normaliza ningún dato. */
function addressLines(address: OrderAddress): string[] {
  const cityLine = [address.postalCode, address.city].filter(Boolean).join(' ')
  const regionLine = [address.state, address.country].filter(Boolean).join(', ')
  return [address.line1, address.line2, cityLine, regionLine, address.phone].filter(
    (line): line is string => Boolean(line && line.length > 0),
  )
}

function ShipmentBlock({ shipment, total }: { shipment: Shipment; total: number }): ReactElement {
  const weightKg = shipment.weightGrams > 0 ? `${(shipment.weightGrams / 1000).toFixed(2)} kg` : null
  return (
    <View testID={`shipment-${shipment.sequenceNo}`} className="gap-2 rounded-field border border-base-300 p-3">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text className="font-medium text-[13px] text-base-content">
          Bulto {shipment.sequenceNo} de {total}
          {weightKg ? ` · ${weightKg}` : ''}
        </Text>
        {shipment.trackingNumber ? (
          <Text className="text-[11px] text-base-content opacity-70">
            {shipment.carrier ? `${shipment.carrier} · ` : ''}
            {shipment.trackingNumber}
          </Text>
        ) : null}
      </View>
      <TrackingTimeline events={shipment.events} />
    </View>
  )
}

export function OrderDetailScreen(): ReactElement {
  const { getOrderDetail, getOrderTracking, cancelOrder } = useOrdersUseCases()
  const locale = useSessionStore((state) => state.locale)
  const { id } = useLocalSearchParams<{ id: string }>()

  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const detail = useQuery({
    queryKey: ['order', id, locale],
    enabled: Boolean(id),
    queryFn: async () => {
      const result = await getOrderDetail.execute(id, locale)
      if (!result.ok) throw result.error
      return result.value
    },
  })

  /**
   * El seguimiento va en su propia consulta: un pedido recién pagado todavía no tiene guía, y un
   * fallo suyo no debe dejar sin ver las líneas ni la dirección del pedido.
   */
  const tracking = useQuery({
    queryKey: ['order-tracking', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const result = await getOrderTracking.execute(id)
      if (!result.ok) throw result.error
      return result.value
    },
  })

  const order = detail.data
  const shipments = tracking.data?.shipments ?? []
  const events = tracking.data?.events ?? []
  const hasTracking = shipments.length > 0 || events.length > 0

  async function cancel(): Promise<void> {
    setCancelling(true)
    setCancelError(null)
    const result = await cancelOrder.execute(id, locale)
    setCancelling(false)
    if (!result.ok) {
      setCancelError(result.error.message)
      return
    }
    // El estado nuevo se relee del servidor: es él quien decide si además hubo reembolso.
    await detail.refetch()
  }

  /**
   * Cancelar es irreversible y devuelve dinero: no puede dispararse por un roce en la pantalla, así
   * que media siempre una confirmación explícita.
   */
  function confirmCancel(): void {
    Alert.alert(
      '¿Cancelar el pedido?',
      'Se cancelará el pedido y se te reembolsará el importe en tu billetera. Esta acción no se puede deshacer.',
      [
        { text: 'No, volver', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: (): void => void cancel() },
      ],
    )
  }

  if (detail.isLoading) {
    return (
      <Screen>
        <Text className="py-8 text-center text-[13px] text-base-content opacity-60">Cargando…</Text>
      </Screen>
    )
  }

  if (detail.isError || !order) {
    return (
      <Screen>
        <EmptyState
          title="No se ha podido cargar el pedido"
          message="Puede que ya no esté disponible o que falle la conexión."
          actionLabel="Volver"
          onAction={(): void => router.back()}
        />
      </Screen>
    )
  }

  return (
    <Screen padded={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 p-5 pb-10">
        <Card className="gap-1">
          <Text className="font-medium text-[17px] text-base-content">{order.orderNumber}</Text>
          <Text className="text-[13px] text-base-content opacity-70">
            {statusLabel(order.status)} · {formatDate(order.placedAt)}
          </Text>
          {order.trackingNumber ? (
            <Text className="text-[12px] text-base-content opacity-60">
              {order.trackingCarrier ? `${order.trackingCarrier} · ` : ''}
              {order.trackingNumber}
            </Text>
          ) : null}
        </Card>

        <Card className="gap-1">
          <Text className="mb-1 font-medium text-[15px] text-base-content">Artículos</Text>
          {order.items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </Card>

        {order.shippingAddress ? (
          <Card className="gap-1">
            <Text className="mb-1 font-medium text-[15px] text-base-content">Dirección de envío</Text>
            <Text className="text-[13px] text-base-content">{order.shippingAddress.fullName}</Text>
            {addressLines(order.shippingAddress).map((line) => (
              <Text key={line} className="text-[13px] text-base-content opacity-70">
                {line}
              </Text>
            ))}
          </Card>
        ) : null}

        <Card>
          <Text className="mb-1 font-medium text-[15px] text-base-content">Resumen</Text>
          <AmountRow label="Subtotal" value={order.subtotalFormatted} />
          <AmountRow label="Envío" value={order.shippingFormatted} />
          <AmountRow label="Impuestos" value={order.taxFormatted} />
          {order.discountFormatted ? (
            <AmountRow label="Descuento" value={order.discountFormatted} />
          ) : null}
          <View className="my-2 h-px bg-base-300" />
          <AmountRow label="Total" value={order.totalFormatted} strong />
        </Card>

        {hasTracking ? (
          <Card className="gap-3">
            <Text className="font-medium text-[15px] text-base-content">Seguimiento</Text>
            {shipments.length > 0 ? (
              shipments.map((shipment) => (
                <ShipmentBlock key={shipment.sequenceNo} shipment={shipment} total={shipments.length} />
              ))
            ) : (
              <TrackingTimeline events={events} />
            )}
          </Card>
        ) : null}

        {isCancellable(order) ? (
          <View className="gap-2">
            {cancelError ? (
              <Text
                accessible
                accessibilityRole="alert"
                accessibilityLabel={cancelError}
                className="text-[13px] text-error"
              >
                {cancelError}
              </Text>
            ) : null}
            <Button
              title="Cancelar pedido"
              variant="outline"
              loading={cancelling}
              onPress={confirmCancel}
            />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  )
}
