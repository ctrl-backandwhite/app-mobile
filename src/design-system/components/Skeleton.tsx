import { ReactElement, useEffect, useState } from 'react'
import { Animated, Easing, ViewStyle } from 'react-native'

interface Props {
  /** Clases de tamaño y forma: `h-4 w-24`, `aspect-square w-full`… */
  className?: string
  style?: ViewStyle
}

/**
 * Hueco que late mientras llega el contenido.
 *
 * Late en lugar de quedarse quieto porque un rectángulo gris inmóvil se lee como un fallo de carga.
 * La animación va en el hilo nativo (`useNativeDriver`), así sigue latiendo aunque el hilo de
 * JavaScript esté ocupado montando la lista que está a punto de sustituirlo.
 */
export function Skeleton({ className = '', style }: Props): ReactElement {
  // Con `useState` de inicialización perezosa y no con `useRef`: leer `.current` durante el
  // render es justo lo que la regla de los hooks prohíbe, y el valor animado solo hay que crearlo una vez.
  const [pulse] = useState(() => new Animated.Value(0.4))

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ opacity: pulse }, style]}
      className={`rounded-selector bg-base-300 ${className}`}
    />
  )
}
