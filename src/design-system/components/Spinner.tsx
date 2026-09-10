import { ReactElement } from 'react'
import { ActivityIndicator, View } from 'react-native'

import { useTheme } from '../tokens/use-theme'

interface Props {
  /** `sm` para esperas dentro de una línea; `md` cuando la espera ocupa un bloque entero. */
  size?: 'sm' | 'md'
  /** Solo para COLOCARLO: márgenes, alineación. */
  className?: string
  testID?: string
}

/**
 * Rueda de espera.
 *
 * <p>Existe para que nadie vuelva a pintar un `ActivityIndicator` a pelo: sin `color` explícito,
 * Android lo dibuja de su verde azulado de serie. Aparecía así en idioma y divisa, en el monedero y
 * en las sesiones —un punto de un color que no está en la paleta, en mitad de una tarjeta vacía—.
 */
export function Spinner({ size = 'md', className = '', testID }: Props): ReactElement {
  const palette = useTheme()

  return (
    <View className={`items-center justify-center ${className}`}>
      <ActivityIndicator
        testID={testID}
        size={size === 'md' ? 'large' : 'small'}
        color={palette.primary}
      />
    </View>
  )
}
