import { LucideIcon } from 'lucide-react-native'
import { ReactElement } from 'react'
import { ActivityIndicator, Pressable } from 'react-native'

import { useTheme } from '../tokens/use-theme'
import { Icon } from './Icon'
import { Text } from './Text'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
  /** Icono a la izquierda del rótulo. Refuerza la acción; nunca la sustituye. */
  icon?: LucideIcon
  /** Icono a la derecha: solo para avanzar («Continuar ›»), no para decorar. */
  trailingIcon?: LucideIcon
  /** Ocupa todo el ancho disponible. En formularios y hojas es lo normal. */
  block?: boolean
  /**
   * Para poder señalar UN botón concreto. Sin él solo queda buscarlo por su rótulo, y eso obliga a
   * que dos botones de la misma pantalla nunca coincidan en el texto: una restricción del diseño
   * impuesta por las pruebas, que es justo al revés de como debe ser.
   */
  testID?: string
}

const SIZES: Record<ButtonSize, { container: string; gap: string }> = {
  sm: { container: 'h-9 px-3', gap: 'gap-1.5' },
  md: { container: 'h-12 px-4', gap: 'gap-2' },
  lg: { container: 'h-14 px-5', gap: 'gap-2' },
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  outline: 'border border-base-300 bg-base-100',
  ghost: 'bg-transparent',
  danger: 'bg-error',
}

/** Tono del rótulo y del icono. El indicador de carga lo hereda para no romper el contraste. */
const CONTENT_TONE: Record<ButtonVariant, 'inverse' | 'default' | 'primary' | 'muted'> = {
  primary: 'inverse',
  secondary: 'inverse',
  outline: 'default',
  ghost: 'primary',
  danger: 'inverse',
}

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  icon,
  trailingIcon,
  block = true,
  testID,
}: Props): ReactElement {
  const palette = useTheme()
  // Cargando también bloquea: un doble envío del formulario duplicaría la petición de red.
  const inert = loading || disabled
  /*
   * Apagado NO es «lo mismo pero translúcido». Con la opacidad al 50 %, el botón primario quedaba en
   * azul lavado con la letra blanca encima: se leía mal y seguía pareciendo pulsable. Un relleno
   * neutro con la tinta media dice a la primera que ahí todavía no hay nada que tocar.
   *
   * Cargando se queda con su color: el botón sí está activo, solo está ocupado.
   */
  const apagado = disabled && !loading
  const tone = apagado ? 'muted' : CONTENT_TONE[variant]

  const spinner =
    tone === 'inverse' ? palette.primaryContent : tone === 'primary' ? palette.primary : palette.baseContent

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: inert, busy: loading }}
      disabled={inert}
      onPress={onPress}
      // El destello nativo es lo que hace que el botón se sienta pulsado en Android; en iOS lo
      // resuelve la opacidad, que se aplica igual en los dos.
      android_ripple={inert ? undefined : { color: `${palette.baseContent}22`, borderless: false }}
      className={[
        'flex-row items-center justify-center rounded-field active:opacity-85',
        SIZES[size].container,
        SIZES[size].gap,
        apagado ? 'border border-base-300 bg-base-300' : VARIANTS[variant],
        block ? 'w-full' : 'self-start',
        loading ? 'opacity-70' : '',
      ].join(' ')}
    >
      {loading ? (
        <ActivityIndicator testID="button-spinner" color={spinner} />
      ) : (
        <>
          {icon ? <Icon glyph={icon} size={size === 'sm' ? 'sm' : 'md'} tone={tone} /> : null}
          <Text variant={size === 'sm' ? 'label' : 'heading'} tone={tone}>
            {title}
          </Text>
          {trailingIcon ? (
            <Icon glyph={trailingIcon} size={size === 'sm' ? 'sm' : 'md'} tone={tone} />
          ) : null}
        </>
      )}
    </Pressable>
  )
}
