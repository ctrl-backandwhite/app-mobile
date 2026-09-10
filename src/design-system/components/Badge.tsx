import { ReactElement } from 'react'
import { View } from 'react-native'

import { Text } from './Text'

/** Qué comunica el distintivo. `accent` es el latón: solo dinero —rebaja, ahorro, margen—. */
export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'error' | 'primary'

interface Props {
  label: string
  tone?: BadgeTone
  className?: string
}

const TONES: Record<BadgeTone, { box: string; text: 'default' | 'inverse' | 'accent' }> = {
  neutral: { box: 'bg-base-300', text: 'default' },
  primary: { box: 'bg-primary', text: 'inverse' },
  accent: { box: 'bg-accent', text: 'inverse' },
  success: { box: 'bg-success', text: 'inverse' },
  warning: { box: 'bg-warning', text: 'inverse' },
  error: { box: 'bg-error', text: 'inverse' },
}

/*
 * `accessible` con la etiqueta ya puesta: un distintivo suelto se lee bien con la vista pero el
 * lector de pantalla lo anuncia sin contexto, y «−30 %» a secas no dice de qué.
 */
export function Badge({ label, tone = 'neutral', className = '' }: Props): ReactElement {
  const style = TONES[tone]

  return (
    <View className={`rounded-selector px-1.5 py-0.5 ${style.box} ${className}`}>
      <Text variant="caption" tone={style.text === 'inverse' ? 'inverse' : 'default'}>
        {label}
      </Text>
    </View>
  )
}
