import { Check } from 'lucide-react-native'
import { ReactElement } from 'react'
import { Pressable, View } from 'react-native'

import { Icon } from './Icon'
import { Text } from './Text'

interface Props {
  label: string
  selected: boolean
  onPress: () => void
  /** Segunda línea: el matiz que distingue esta opción de la de al lado. */
  description?: string
  /** Emblema corto delante del rótulo: una bandera, un símbolo de moneda. Nunca una frase. */
  leading?: string
  /** Sin línea inferior: la última opción del grupo. */
  last?: boolean
  testID?: string
}

/**
 * Opción de una lista donde solo se elige una.
 *
 * La marca va a la derecha y no a la izquierda: el ojo recorre los rótulos por el margen izquierdo y
 * una columna de casillas vacías delante estorba esa lectura.
 */
export function OptionRow({
  label,
  selected,
  onPress,
  description,
  leading,
  last = false,
  testID,
}: Props): ReactElement {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-[52px] flex-row items-center justify-between gap-3 py-3 active:opacity-70 ${
        last ? '' : 'border-b border-base-200'
      }`}
    >
      {leading ? <Text variant="title">{leading}</Text> : null}
      <View className="flex-1">
        <Text variant="body" tone={selected ? 'primary' : 'default'}>
          {label}
        </Text>
        {description ? (
          <Text variant="caption" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      {selected ? <Icon glyph={Check} size="md" tone="primary" /> : null}
    </Pressable>
  )
}
