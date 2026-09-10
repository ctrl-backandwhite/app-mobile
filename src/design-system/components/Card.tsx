import { ReactElement, ReactNode } from 'react'
import { Pressable, View } from 'react-native'

export type CardVariant = 'outlined' | 'elevated' | 'flat'

/** `none` solo para tarjetas cuyo contenido llega a los bordes: una imagen, una lista a sangre. */
export type CardPadding = 'none' | 'sm' | 'md'

interface Props {
  children: ReactNode
  variant?: CardVariant
  padding?: CardPadding
  /** Convierte la tarjeta en pulsable. Sin esto no hay ni destello ni papel de botón. */
  onPress?: () => void
  accessibilityLabel?: string
  className?: string
  testID?: string
}

const VARIANTS: Record<CardVariant, string> = {
  outlined: 'border border-base-300 bg-base-100',
  elevated: 'bg-base-100 shadow-sm',
  flat: 'bg-base-200',
}

const PADDINGS: Record<CardPadding, string> = { none: '', sm: 'p-4', md: 'p-5' }

/**
 * Contenedor de un bloque de contenido.
 *
 * <p>El relleno tiene su propia propiedad y NO se pasa por `className`. Antes el relleno era el valor
 * por omisión de `className`, así que escribir `className="gap-1"` para separar dos líneas lo
 * borraba entero sin decir nada: en el detalle del pedido, cuatro tarjetas tenían el texto pegado al
 * borde. Un ajuste no puede llevarse por delante otro que no se ha nombrado.
 */
export function Card({
  children,
  variant = 'outlined',
  padding = 'md',
  onPress,
  accessibilityLabel,
  className = '',
  testID,
}: Props): ReactElement {
  const base = `rounded-box overflow-hidden ${VARIANTS[variant]} ${PADDINGS[padding]} ${className}`

  if (!onPress) {
    return (
      <View testID={testID} className={base}>
        {children}
      </View>
    )
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={`${base} active:opacity-90`}
    >
      {children}
    </Pressable>
  )
}
