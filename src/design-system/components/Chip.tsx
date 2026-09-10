import { LucideIcon } from 'lucide-react-native'
import { ReactElement } from 'react'
import { Pressable } from 'react-native'

import { Icon } from './Icon'
import { Text } from './Text'

interface Props {
  label: string
  onPress: () => void
  /** Marcado: el filtro está aplicado. Se ve Y se anuncia al lector de pantalla. */
  selected?: boolean
  icon?: LucideIcon
  testID?: string
}

/** Filtro o categoría de una fila desplazable. Un toque lo aplica, otro lo quita. */
export function Chip({ label, onPress, selected = false, icon, testID }: Props): ReactElement {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      // El nombre accesible es el rótulo: sin él la píldora se anuncia vacía y solo se puede
      // localizar por su posición, ni con un lector de pantalla ni en una prueba.
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`h-9 flex-row items-center gap-1.5 rounded-full px-3.5 active:opacity-80 ${
        selected ? 'bg-primary' : 'border border-base-300 bg-base-100'
      }`}
    >
      {icon ? <Icon glyph={icon} size="sm" tone={selected ? 'inverse' : 'muted'} /> : null}
      <Text variant="label" tone={selected ? 'inverse' : 'default'}>
        {label}
      </Text>
    </Pressable>
  )
}
