import { ReactElement } from 'react'
import { Text, View } from 'react-native'

export type AlertVariant = 'error' | 'warning' | 'info' | 'success'

interface Props {
  variant: AlertVariant
  message: string
}

/** Color al 12 % de fondo y pleno en el texto: el mismo peso visual que `alert-*` en el escritorio. */
const STYLES: Record<AlertVariant, { container: string; label: string }> = {
  error: { container: 'border-error/30 bg-error/[0.12]', label: 'text-error' },
  warning: { container: 'border-warning/30 bg-warning/[0.12]', label: 'text-warning' },
  info: { container: 'border-info/30 bg-info/[0.12]', label: 'text-info' },
  success: { container: 'border-success/30 bg-success/[0.12]', label: 'text-success' },
}

export function Alert({ variant, message }: Props): ReactElement {
  const style = STYLES[variant]

  return (
    <View accessibilityRole="alert" className={`rounded-field border px-3 py-2 ${style.container}`}>
      <Text className={`text-[13px] ${style.label}`}>{message}</Text>
    </View>
  )
}
