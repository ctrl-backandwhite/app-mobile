import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { ImageOff } from 'lucide-react-native'
import { ReactElement, useState } from 'react'
import { Alert, ScrollView, View } from 'react-native'

import { Button, Card, Icon, RemoteImage, Screen, Skeleton, Text } from '@ds/components'
import { useSessionStore } from '@features/auth/presentation/state/session.store'
import { EmptyState } from '@features/catalog/presentation/components'
import { isCancellable } from '@features/orders/domain/entities/order'
import { useCountryNames } from '@features/checkout/presentation/hooks/use-country-name'
import { OrderAddress, OrderItem } from '@features/orders/domain/entities/order-detail'
import { Shipment } from '@features/orders/domain/entities/tracking'

import { OrderStatusBadge, TrackingTimeline } from '../components'
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
      <Text variant="label" tone={strong ? 'default' : 'muted'}>
        {label}
      </Text>
      <Text variant={strong ? 'price' : 'label'} tone={value ? 'default' : 'muted'}>
        {value ?? NO_AMOUNT}
      </Text>
    </View>
  )
}

function ItemRow({ item }: { item: OrderItem }): ReactElement {
  return (
    <View testID={`order-item-${item.id}`} className="flex-row gap-3 py-2">
      {item.imageUrl ? (
        <RemoteImage uri={item.imageUrl} className="h-14 w-14 rounded-selector bg-base-200" />
      ) : (
        // Con el hueco vacío parecía que la foto no había cargado y que era cosa de esperar. El
        // icono dice lo que pasa de verdad: esa variante no tiene imagen y no va a aparecer.
        <View className="h-14 w-14 items-center justify-center rounded-selector bg-base-200">
          <Icon glyph={ImageOff} size="md" tone="muted" />
        </View>
      )}
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={2} variant="label" className="leading-[18px]">
          {item.productTitle}
        </Text>
        {item.variantName ? (
          <Text variant="caption" tone="muted">{item.variantName}</Text>
        ) : null}
        <View className="flex-row items-center justify-between gap-2">
          <Text variant="caption" tone="muted">×{item.quantity}</Text>
          <Text
            variant="label"
            tone={item.lineTotalFormatted ? 'default' : 'muted'}
          >
            {item.lineTotalFormatted ?? NO_AMOUNT}
          </Text>
        </View>
      </View>
    </View>
  )
}

/**
 * Las líneas de la dirección se componen tal y como llegaron: aquí no se normaliza ningún dato.
 *
 * El país es la excepción y llega ya con nombre: una dirección que termina en «ES» está a medio
 * escribir, y el nombre lo sirve el backend traducido.
 */
function addressLines(address: OrderAddress, countryName: string): string[] {
  const cityLine = [address.postalCode, address.city].filter(Boolean).join(' ')
  const regionLine = [address.state, countryName || address.country].filter(Boolean).join(', ')
  return [address.line1, address.line2, cityLine, regionLine, address.phone].filter(
    (line): line is string => Boolean(line && line.length > 0),
  )
}

function ShipmentBlock({ shipment, total }: { shipment: Shipment; total: number }): ReactElement {
  const weightKg = shipment.weightGrams > 0 ? `${(shipment.weightGrams / 1000).toFixed(2)} kg` : null
  return (
    <View testID={`shipment-${shipment.sequenceNo}`} className="gap-2 rounded-field border border-base-300 p-3">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text variant="label">
          Bulto {shipment.sequenceNo} de {total}
          {weightKg ? ` · ${weightKg}` : ''}
        </Text>
        {shipment.trackingNumber ? (
          <Text variant="caption" tone="muted">
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
  const nombreDelPais = useCountryNames()

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
        <View className="gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-28 w-full" />
        </View>
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
        {/*
          La referencia del pedido es lo primero: es el dato que se copia para preguntar por él, y
          antes no salía en ninguna parte de esta pantalla —el título del navegador solo pone
          «Pedido»—.
        */}
        <View className="mb-1 gap-0.5">
          <Text variant="eyebrow" tone="muted">
            Pedido
          </Text>
          <Text variant="title" selectable>
            {order.orderNumber}
          </Text>
        </View>

        <Card className="gap-2">
          <View className="flex-row items-center justify-between gap-3">
            <Text variant="label" tone="muted">
              {formatDate(order.placedAt)}
            </Text>
            <OrderStatusBadge status={order.status} />
          </View>
          {order.trackingNumber ? (
            <Text variant="caption" tone="muted">
              {order.trackingCarrier ? `${order.trackingCarrier} · ` : ''}
              {order.trackingNumber}
            </Text>
          ) : null}
        </Card>

        <Card className="gap-1">
          <Text variant="heading" className="mb-1">Artículos</Text>
          {order.items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </Card>

        {order.shippingAddress ? (
          <Card className="gap-1">
            <Text variant="heading" className="mb-1">Dirección de envío</Text>
            <Text variant="label">{order.shippingAddress.fullName}</Text>
            {addressLines(order.shippingAddress, nombreDelPais(order.shippingAddress.country)).map((line) => (
              <Text key={line} variant="label" tone="muted">
                {line}
              </Text>
            ))}
          </Card>
        ) : null}

        <Card>
          <Text variant="heading" className="mb-1">Resumen</Text>
          <AmountRow label="Subtotal" value={order.subtotalFormatted} />
          <AmountRow label="Envío" value={order.shippingFormatted} />
          {/*
            El arancel va en su propia línea, igual que en el resumen del pago. Sumado dentro del
            envío, el pedido decía «Envío 9,74 €» donde al pagar ponía «Envío 6,25 € · Aranceles
            3,49 €»: el mismo dinero contado de dos formas hace dudar de lo cobrado, y en régimen DDP
            el derecho de aduana es además un concepto con nombre propio.
          */}
          {order.customsDutyFormatted ? (
            <AmountRow label="Aranceles" value={order.customsDutyFormatted} />
          ) : null}
          <AmountRow label="Impuestos" value={order.taxFormatted} />
          {order.discountFormatted ? (
            <AmountRow label="Descuento" value={order.discountFormatted} />
          ) : null}
          <View className="my-2 h-px bg-base-300" />
          <AmountRow label="Total" value={order.totalFormatted} strong />
        </Card>

        {hasTracking ? (
          <Card className="gap-3">
            <Text variant="heading">Seguimiento</Text>
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
              <Text accessible
        accessibilityRole="alert"
        accessibilityLabel={cancelError}
        variant="label" tone="error">
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
