import { ReactElement } from 'react'
import { View } from 'react-native'

import { Text } from '@ds/components'

import { sortEventsByDate, TrackingEvent } from '@features/orders/domain/entities/tracking'

import { formatDateTime } from '../lib/format-date'

interface Props {
  events: readonly TrackingEvent[]
}

/** Segunda línea del paso: cuándo ocurrió y, si se sabe, dónde. */
function subtitleOf(event: TrackingEvent): string {
  const when = formatDateTime(event.occurredAt)
  return event.location ? `${when} · ${event.location}` : when
}

/**
 * Los pasos del envío, el más reciente arriba.
 *
 * El orden lo decide el dominio (`sortEventsByDate`): el backend los devuelve de más antiguo a más
 * reciente y quien abre el seguimiento quiere saber PRIMERO dónde está el paquete ahora.
 */
export function TrackingTimeline({ events }: Props): ReactElement {
  const ordered = sortEventsByDate(events)

  if (ordered.length === 0) {
    return (
      <Text variant="label" tone="muted">
        Todavía no hay movimientos registrados.
      </Text>
    )
  }

  return (
    <View accessibilityRole="list">
      {ordered.map((event, index) => {
        const isLast = index === ordered.length - 1
        return (
          <View key={`${index}-${event.status}`} className="flex-row gap-3">
            {/* Carril del hilo: el punto del paso y el tramo que lo une con el siguiente. */}
            <View className="items-center">
              <View
                className={`mt-1 h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-primary' : 'bg-base-300'}`}
              />
              {isLast ? null : <View className="w-px flex-1 bg-base-300" />}
            </View>

            <View className={`flex-1 gap-0.5 ${isLast ? '' : 'pb-4'}`}>
              <Text variant="label" className="leading-[18px]">
                {event.description ?? event.status}
              </Text>
              <Text variant="caption" tone="muted">{subtitleOf(event)}</Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}
