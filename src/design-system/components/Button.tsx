import { ReactElement } from 'react'
import { ActivityIndicator, Pressable, Text } from 'react-native'

import { colors } from '../tokens'

export type ButtonVariant = 'primary' | 'outline' | 'ghost'

interface Props {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: ButtonVariant
  /**
   * Para poder señalar UN botón concreto. Sin él solo queda buscarlo por su rótulo, y eso obliga a
   * que dos botones de la misma pantalla nunca coincidan en el texto: una restricción del diseño
   * impuesta por las pruebas, que es justo al revés de como debe ser.
   */
  testID?: string
}

const BASE = 'h-12 flex-row items-center justify-center gap-2 rounded-field px-4'
const LABEL = 'font-medium text-[15px]'

const STYLES: Record<ButtonVariant, { container: string; label: string }> = {
  primary: { container: `${BASE} bg-primary`, label: `${LABEL} text-primary-content` },
  outline: { container: `${BASE} border border-base-300 bg-base-100`, label: `${LABEL} text-base-content` },
  ghost: { container: `${BASE} bg-transparent`, label: `${LABEL} text-primary` },
}

/** El indicador hereda el color del texto del botón para no romper el contraste de cada variante. */
const SPINNER: Record<ButtonVariant, string> = {
  primary: colors.light.primaryContent,
  outline: colors.light.primary,
  ghost: colors.light.primary,
}

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  testID,
}: Props): ReactElement {
  // Cargando también bloquea: un doble envío del formulario duplicaría la petición de red.
  const inert = loading || disabled
  const style = STYLES[variant]

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: inert, busy: loading }}
      disabled={inert}
      onPress={onPress}
      className={`${style.container} ${inert ? 'opacity-60' : ''}`}
    >
      {loading ? (
        <ActivityIndicator testID="button-spinner" color={SPINNER[variant]} />
      ) : (
        <Text className={style.label}>{title}</Text>
      )}
    </Pressable>
  )
}
