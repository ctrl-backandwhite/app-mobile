import { ChevronRight } from 'lucide-react-native'
import { ReactElement } from 'react'
import { Pressable, View } from 'react-native'

import { Icon, Text } from '@ds/components'

import { Order, statusLabel } from '@features/orders/domain/entities/order'

import { formatDate } from '../lib/format-date'
import { OrderStatusBadge } from './OrderStatusBadge'

interface Props {
  order: Order
  onPress: (order: Order) => void
}

/**
 * Hueco del importe.
 *
 * La app NUNCA calcula ni formatea dinero: el margen, los impuestos y la tasa del día los aplica el
 * backend, y un número compuesto aquí dejaría de coincidir con lo que se cobró. Antes un guion que
 * un importe que la factura desmiente.
 */
const NO_AMOUNT = '—'

function itemsLabel(itemCount: number): string {
  return itemCount === 1 ? '1 artículo' : `${itemCount} artículos`
}

export function OrderCard({ order, onPress }: Props): ReactElement {
  // La traducción del estado vive en el dominio; el color, en el distintivo compartido.
  const label = statusLabel(order.status)
  const amount = order.totalFormatted

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Pedido ${order.orderNumber}, ${label}`}
      accessibilityHint="Abre el detalle del pedido"
      testID={`order-card-${order.id}`}
      onPress={(): void => onPress(order)}
      className="gap-2 rounded-box border border-base-300 bg-base-100 p-4 active:opacity-70"
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text variant="label" numberOfLines={1} className="shrink">
          {order.orderNumber}
        </Text>
        <OrderStatusBadge status={order.status} />
      </View>

      <View className="flex-row items-end justify-between gap-2">
        <View className="gap-0.5">
          <Text variant="caption" tone="muted">{formatDate(order.placedAt)}</Text>
          <Text variant="caption" tone="muted">
            {itemsLabel(order.itemCount)}
          </Text>
        </View>
        {/* La flecha dice que la tarjeta se abre. Sin ella la ficha parece un resumen y nadie la
            toca: es la única forma de llegar al seguimiento del envío. */}
        <View className="flex-row items-center gap-1">
          <Text
            testID={`order-total-${order.id}`}
            variant="price"
            tone={amount ? 'default' : 'muted'}
          >
            {amount ?? NO_AMOUNT}
          </Text>
          <Icon glyph={ChevronRight} size="md" tone="muted" />
        </View>
      </View>
    </Pressable>
  )
}
