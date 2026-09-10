import { ChevronDown, LucideIcon } from 'lucide-react-native'
import { ReactElement } from 'react'
import { Pressable, View } from 'react-native'

import { Icon } from './Icon'
import { Text } from './Text'

interface Props {
  label: string
  /** Lo elegido, ya con el texto que se lee. Vacío o nulo enseña el marcador. */
  value?: string | null
  onPress: () => void
  placeholder?: string
  error?: string | null
  /** Aclaración bajo el campo cuando no hay error. */
  hint?: string
  icon?: LucideIcon
  testID?: string
}

/**
 * Campo que no se teclea: se pulsa y se elige.
 *
 * Va calcado a `TextField` a propósito —mismo alto, mismo borde, misma etiqueta—: en un formulario,
 * un control que se comporta distinto pero se parece a medias hace dudar de si se puede escribir en
 * él. La flecha hacia abajo es lo único que lo distingue, y es lo que dice que hay una lista detrás.
 */
export function SelectField({
  label,
  value,
  onPress,
  placeholder,
  error,
  hint,
  icon,
  testID,
}: Props): ReactElement {
  const elegido = typeof value === 'string' && value.length > 0

  return (
    <View className="gap-1.5">
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: elegido ? value : (placeholder ?? '') }}
        onPress={onPress}
        className={`h-12 flex-row items-center gap-2 rounded-field border bg-base-100 px-3 active:opacity-70 ${
          error ? 'border-error' : 'border-base-300'
        }`}
      >
        {icon ? <Icon glyph={icon} size="md" tone="muted" /> : null}
        <Text variant="body" tone={elegido ? 'default' : 'muted'} className="flex-1" numberOfLines={1}>
          {elegido ? value : (placeholder ?? '')}
        </Text>
        <Icon glyph={ChevronDown} size="md" tone="muted" />
      </Pressable>
      {error ? (
        <Text variant="caption" tone="error">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  )
}
