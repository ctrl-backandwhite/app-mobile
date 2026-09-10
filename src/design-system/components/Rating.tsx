import { Star } from 'lucide-react-native'
import { ReactElement } from 'react'
import { View } from 'react-native'

import { useTheme } from '../tokens/use-theme'
import { Text } from './Text'

interface Props {
  /** Valoración de 0 a 5. */
  value: number
  /** Número de opiniones, si se conoce. */
  count?: number
  /** Cinco estrellas para la ficha; una sola para la tarjeta, donde no cabe más. */
  compact?: boolean
}

const MAX = 5

/** Valoración en estrellas. La estrella va rellena, que es como se lee de un vistazo. */
export function Rating({ value, count, compact = false }: Props): ReactElement {
  const palette = useTheme()
  const rounded = Math.round(value)
  const label = count != null ? `${value.toFixed(1)} de 5, ${count} opiniones` : `${value.toFixed(1)} de 5`

  return (
    <View accessible accessibilityLabel={label} className="flex-row items-center gap-1">
      {compact ? (
        <Star size={13} color={palette.accent} fill={palette.accent} strokeWidth={0} />
      ) : (
        Array.from({ length: MAX }, (_, index) => (
          <Star
            key={index}
            size={15}
            color={index < rounded ? palette.accent : palette.base300}
            fill={index < rounded ? palette.accent : palette.base300}
            strokeWidth={0}
          />
        ))
      )}
      <Text variant="caption" tone="muted" className="ml-0.5">
        {value.toFixed(1)}
        {count != null ? ` (${count})` : ''}
      </Text>
    </View>
  )
}
