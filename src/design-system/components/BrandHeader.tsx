import { LinearGradient } from 'expo-linear-gradient'
import { ReactElement } from 'react'
import { Text, View } from 'react-native'

import { colors, fontFamily, fontSize, letterSpacingOf } from '../tokens'

interface Props {
  subtitle?: string
}

/** Cobalto → marino → latón en diagonal: la columna de marca del escritorio, en horizontal. */
const GRADIENT: readonly [string, string, string] = [
  colors.light.primary,
  colors.light.secondary,
  colors.light.accent,
]

export function BrandHeader({ subtitle }: Props): ReactElement {
  return (
    <View className="h-[180px] overflow-hidden rounded-b-box">
      <LinearGradient
        colors={GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        // NativeWind no intercepta este componente, así que el relleno va por estilo.
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-end p-6">
          <Text
            className="text-[28px] text-primary-content"
            style={{ fontFamily: fontFamily.bold, letterSpacing: letterSpacingOf(28) }}
          >
            NX036
          </Text>
          {subtitle ? (
            <Text
              className="mt-1 text-primary-content opacity-90"
              style={{ fontSize: fontSize.base }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  )
}
