import { ChevronRight, LucideIcon } from 'lucide-react-native'
import { ReactElement, ReactNode } from 'react'
import { Pressable, View } from 'react-native'

import { Icon } from './Icon'
import { Text } from './Text'

interface Props {
  title: string
  onPress: () => void
  /** Segunda línea: qué se encuentra al entrar, o el valor que hay puesto ahora. */
  description?: string
  icon?: LucideIcon
  /** A la derecha, antes de la flecha: un distintivo, una cifra, un interruptor. */
  trailing?: ReactNode
  /** Sin línea inferior: la última fila de un grupo. */
  last?: boolean
  /** Destaca en rojo las acciones que destruyen algo. */
  danger?: boolean
  testID?: string
}

/**
 * Fila de navegación de una lista de ajustes o accesos.
 *
 * Alto de dedo y toda la fila pulsable, no solo el texto. El icono va dentro de un disco tenue: sin
 * él, una columna de trazos sueltos junto al texto se lee como ruido en vez de como una lista.
 */
export function ListRow({
  title,
  onPress,
  description,
  icon,
  trailing,
  last = false,
  danger = false,
  testID,
}: Props): ReactElement {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      onPress={onPress}
      className={`min-h-[56px] flex-row items-center gap-3 py-3 active:opacity-70 ${
        last ? '' : 'border-b border-base-200'
      }`}
    >
      {icon ? (
        <View
          className={`h-9 w-9 items-center justify-center rounded-selector ${
            danger ? 'bg-error/[0.12]' : 'bg-base-200'
          }`}
        >
          <Icon glyph={icon} size="md" tone={danger ? 'error' : 'primary'} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text variant="body" tone={danger ? 'error' : 'default'}>
          {title}
        </Text>
        {description ? (
          <Text variant="caption" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      {trailing}
      <Icon glyph={ChevronRight} size="md" tone="muted" />
    </Pressable>
  )
}
