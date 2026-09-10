import { ReactElement } from 'react'
import { View } from 'react-native'

import { Text } from '@ds/components'
import { OrderTone, statusLabel, statusTone } from '@features/orders/domain/entities/order'

interface Props {
  status: string
}

/** Mismo peso visual que los avisos del escritorio: color al 12 % de fondo y pleno en el texto. */
const TONE_STYLES: Record<OrderTone, { container: string; label: string }> = {
  progress: { container: 'bg-info/[0.12]', label: 'text-info' },
  done: { container: 'bg-success/[0.12]', label: 'text-success' },
  cancelled: { container: 'bg-error/[0.12]', label: 'text-error' },
}

/**
 * En qué punto está el pedido.
 *
 * Vive aparte porque la lista y el detalle lo enseñan a la vez: cuando cada pantalla lo pintaba por
 * su cuenta, el mismo «Pagado» salía como distintivo en una y como una línea de texto suelta en la
 * otra, y costaba reconocer que hablaban del mismo estado.
 */
export function OrderStatusBadge({ status }: Props): ReactElement {
  const tone = TONE_STYLES[statusTone(status)]

  return (
    <View className={`shrink-0 rounded-selector px-2 py-0.5 ${tone.container}`}>
      <Text variant="caption" className={tone.label}>
        {statusLabel(status)}
      </Text>
    </View>
  )
}
