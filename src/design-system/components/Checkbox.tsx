import { Check } from 'lucide-react-native'
import { ReactElement, ReactNode } from 'react'
import { Pressable, View } from 'react-native'

import { Icon } from './Icon'
import { Text } from './Text'

interface Props {
  label: string
  checked: boolean
  onToggle: () => void
  /** Contenido bajo la etiqueta: enlaces legales, una aclaración. Queda alineado con el texto. */
  children?: ReactNode
  testID?: string
}

/** Casilla de verificación. El área pulsable abarca la etiqueta entera, no solo el cuadro. */
export function Checkbox({ label, checked, onToggle, children, testID }: Props): ReactElement {
  return (
    <View>
      <Pressable
        testID={testID}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        onPress={onToggle}
        hitSlop={6}
        className="flex-row items-start gap-3"
      >
        <View
          className={`mt-px h-5 w-5 items-center justify-center rounded-selector border ${
            checked ? 'border-primary bg-primary' : 'border-base-300 bg-base-100'
          }`}
        >
          {checked ? <Icon glyph={Check} size="sm" tone="inverse" /> : null}
        </View>
        <Text variant="label" className="flex-1 font-light">
          {label}
        </Text>
      </Pressable>
      {/* 32 px = ancho del cuadro más su separación: lo de debajo cuelga del texto, no del margen. */}
      {children ? <View className="mt-1.5 pl-8">{children}</View> : null}
    </View>
  )
}
