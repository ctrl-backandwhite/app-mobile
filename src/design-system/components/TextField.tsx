import { LucideIcon } from 'lucide-react-native'
import { ReactElement, useState } from 'react'
import { TextInput, TextInputProps, View } from 'react-native'

import { useTheme } from '../tokens/use-theme'
import { Icon } from './Icon'
import { Text } from './Text'

export interface TextFieldProps extends TextInputProps {
  label: string
  error?: string | null
  /** Icono dentro del campo, a la izquierda. Ayuda a reconocer el campo de un vistazo. */
  icon?: LucideIcon
  /** Aclaración bajo el campo cuando no hay error: formato esperado, dónde encontrar el dato… */
  hint?: string
}

export function TextField({ label, error, icon, hint, ...input }: TextFieldProps): ReactElement {
  const palette = useTheme()
  // El foco se marca con el color de marca: sin señal visible no se sabe qué campo recibe el teclado.
  const [focused, setFocused] = useState(false)

  const border = error ? 'border-error' : focused ? 'border-primary' : 'border-base-300'

  return (
    <View className="gap-1.5">
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <View
        className={`h-12 flex-row items-center gap-2 rounded-field border bg-base-100 px-3 ${border}`}
      >
        {icon ? <Icon glyph={icon} size="md" tone={focused ? 'primary' : 'muted'} /> : null}
        <TextInput
          // La etiqueta visible es también el nombre accesible: el lector de pantalla y los tests
          // E2E localizan el campo por el mismo texto que ve la persona usuaria.
          accessibilityLabel={label}
          placeholderTextColor={palette.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="h-12 flex-1 font-light text-body text-base-content"
          {...input}
        />
      </View>
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
