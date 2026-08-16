import { ReactElement } from 'react'
import { Pressable, Text, View } from 'react-native'

import { Order, OrderTone, statusLabel, statusTone } from '@features/orders/domain/entities/order'

import { formatDate } from '../lib/format-date'

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

/** Mismo peso visual que los avisos del escritorio: color al 12 % de fondo y pleno en el texto. */
const TONE_STYLES: Record<OrderTone, { container: string; label: string }> = {
  progress: { container: 'bg-info/[0.12]', label: 'text-info' },
  done: { container: 'bg-success/[0.12]', label: 'text-success' },
  cancelled: { container: 'bg-error/[0.12]', label: 'text-error' },
}

function itemsLabel(itemCount: number): string {
  return itemCount === 1 ? '1 artículo' : `${itemCount} artículos`
}

export function OrderCard({ order, onPress }: Props): ReactElement {
  // La traducción y la clasificación del estado viven en el dominio: aquí solo se decide el color.
  const label = statusLabel(order.status)
  const tone = TONE_STYLES[statusTone(order.status)]
  const amount = order.totalFormatted

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Pedido ${order.orderNumber}, ${label}`}
      accessibilityHint="Abre el detalle del pedido"
      testID={`order-card-${order.id}`}
      onPress={(): void => onPress(order)}
      className="gap-2 rounded-box border border-base-300 bg-base-100 p-4"
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text className="font-medium text-[13px] text-base-content">{order.orderNumber}</Text>
        <View className={`rounded-selector px-2 py-0.5 ${tone.container}`}>
          <Text className={`text-[11px] font-medium ${tone.label}`}>{label}</Text>
        </View>
      </View>

      <View className="flex-row items-end justify-between gap-2">
        <View className="gap-0.5">
          <Text className="text-[12px] text-base-content opacity-60">{formatDate(order.placedAt)}</Text>
          <Text className="text-[12px] text-base-content opacity-60">
            {itemsLabel(order.itemCount)}
          </Text>
        </View>
        <Text
          testID={`order-total-${order.id}`}
          className={`font-medium text-[15px] text-base-content ${amount ? '' : 'opacity-40'}`}
        >
          {amount ?? NO_AMOUNT}
        </Text>
      </View>
    </Pressable>
  )
}
