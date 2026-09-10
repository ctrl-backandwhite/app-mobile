import { LucideIcon, LucideProps } from 'lucide-react-native'
import { ReactElement } from 'react'

import { useTheme } from '../tokens/use-theme'

/** Tamaños del sistema. Un icono suelto de 19 px descuadra la fila en la que vive. */
export type IconSize = 'sm' | 'md' | 'lg' | 'xl'

export type IconTone =
  | 'default'
  | 'muted'
  | 'primary'
  | 'accent'
  | 'inverse'
  | 'success'
  | 'warning'
  | 'error'

interface Props extends Omit<LucideProps, 'size' | 'color' | 'strokeWidth'> {
  /** El icono de Lucide, pasado como componente: `<Icon glyph={ShoppingCart} />`. */
  glyph: LucideIcon
  size?: IconSize
  tone?: IconTone
}

const SIZES: Record<IconSize, number> = { sm: 14, md: 18, lg: 22, xl: 28 }

/*
 * Trazo de 1,5: es lo que hace que el icono y la letra parezcan de la misma mano. Lucide viene a 2 y
 * junto a Roboto Light se ve tosco, como un icono pegado encima del texto en vez de escrito con él.
 */
const STROKE = 1.5

export function Icon({ glyph: Glyph, size = 'md', tone = 'default', ...rest }: Props): ReactElement {
  const palette = useTheme()

  const TONES: Record<IconTone, string> = {
    default: palette.baseContent,
    muted: palette.muted,
    primary: palette.primary,
    accent: palette.accent,
    inverse: palette.primaryContent,
    success: palette.success,
    warning: palette.warning,
    error: palette.error,
  }

  return <Glyph size={SIZES[size]} color={TONES[tone]} strokeWidth={STROKE} {...rest} />
}
