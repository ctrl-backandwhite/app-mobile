import { ReactElement } from 'react'
import { View } from 'react-native'

import { BrandMark, Text } from '@ds/components'

interface Props {
  /** Qué se hace en esta pantalla, en una línea. */
  subtitle: string
}

/**
 * Cabecera de las pantallas de acceso: el logotipo y una línea.
 *
 * Las cuatro pantallas de entrada comparten remate para que se lean como una sola puerta y no como
 * cuatro formularios sueltos. Va desnuda a propósito: aquí no hay nada que agrupar y el adorno solo
 * restaría a lo único que importa, que es entrar.
 */
export function AuthHeader({ subtitle }: Props): ReactElement {
  return (
    <View className="items-center gap-2 pb-10">
      <BrandMark size={44} />
      <Text variant="body" tone="muted" className="text-center">
        {subtitle}
      </Text>
    </View>
  )
}
