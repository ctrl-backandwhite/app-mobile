import { CircleAlert, CircleCheck, Info, LucideIcon, TriangleAlert } from 'lucide-react-native'
import { ReactElement } from 'react'
import { View } from 'react-native'

import { Icon, IconTone } from './Icon'
import { Text, TextTone } from './Text'

export type AlertVariant = 'error' | 'warning' | 'info' | 'success'

interface Props {
  variant: AlertVariant
  message: string
}

/**
 * Color al 12 % de fondo y pleno en el icono: el mismo peso visual que `alert-*` en el escritorio.
 *
 * El texto y el icono llevan tonos SEPARADOS por el aviso de ámbar: ese color no llega al contraste
 * que necesita una frase pequeña —2,47 sobre el fondo claro—, así que la frase va en tinta y quien
 * pone el color es el icono, que es una mancha y no una letra.
 */
const STYLES: Record<
  AlertVariant,
  { container: string; text: TextTone; icon: IconTone; glyph: LucideIcon }
> = {
  error: {
    container: 'border-error/30 bg-error/[0.12]',
    text: 'error',
    icon: 'error',
    glyph: CircleAlert,
  },
  warning: {
    container: 'border-warning/30 bg-warning/[0.12]',
    text: 'default',
    icon: 'warning',
    glyph: TriangleAlert,
  },
  info: {
    container: 'border-info/30 bg-info/[0.12]',
    text: 'primary',
    icon: 'primary',
    glyph: Info,
  },
  success: {
    container: 'border-success/30 bg-success/[0.12]',
    text: 'success',
    icon: 'success',
    glyph: CircleCheck,
  },
}

/**
 * `accessible` no es opcional aquí: sin él la vista no es un elemento accesible, así que el rol de
 * aviso se ignora y un lector de pantalla lee el texto suelto en vez de anunciarlo como alerta.
 * `accessibilityLiveRegion` hace que Android lo lea en cuanto aparece, que es justo lo que se espera
 * de un error de formulario que surge tras pulsar un botón.
 */
export function Alert({ variant, message }: Props): ReactElement {
  const style = STYLES[variant]

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion={variant === 'error' ? 'assertive' : 'polite'}
      accessibilityLabel={message}
      className={`flex-row items-start gap-2 rounded-field border px-3 py-2.5 ${style.container}`}
    >
      {/* El icono no se anuncia aparte: el mensaje ya viaja en la etiqueta del contenedor. */}
      <View className="mt-0.5">
        <Icon glyph={style.glyph} size="sm" tone={style.icon} />
      </View>
      <Text variant="label" tone={style.text} className="flex-1">
        {message}
      </Text>
    </View>
  )
}
