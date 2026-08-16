import { ReactElement } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'

import { colors } from '@ds/tokens'

interface Props {
  onPress: () => void
  loading?: boolean
  disabled?: boolean
}

/**
 * Marca de Google dibujada con vistas.
 *
 * Las directrices de Google exigen su logotipo con los cuatro colores exactos, y no hay ninguna
 * biblioteca de iconos instalada. Cuatro vistas pesan menos que añadir una dependencia entera para un
 * único icono.
 */
function GoogleMark(): ReactElement {
  return (
    <View className="h-[18px] w-[18px] flex-row flex-wrap overflow-hidden rounded-[2px]">
      <View className="h-[9px] w-[9px]" style={{ backgroundColor: '#ea4335' }} />
      <View className="h-[9px] w-[9px]" style={{ backgroundColor: '#4285f4' }} />
      <View className="h-[9px] w-[9px]" style={{ backgroundColor: '#fbbc05' }} />
      <View className="h-[9px] w-[9px]" style={{ backgroundColor: '#34a853' }} />
    </View>
  )
}

export function GoogleButton({ onPress, loading = false, disabled = false }: Props): ReactElement {
  const inert = loading || disabled

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continuar con Google"
      accessibilityState={{ disabled: inert, busy: loading }}
      disabled={inert}
      onPress={onPress}
      className={`h-12 flex-row items-center justify-center gap-3 rounded-field border border-base-300 bg-base-100 px-4 ${
        inert ? 'opacity-60' : ''
      }`}
    >
      {loading ? (
        <ActivityIndicator testID="google-spinner" color={colors.light.primary} />
      ) : (
        <>
          <GoogleMark />
          <Text className="font-medium text-[15px] text-base-content">Continuar con Google</Text>
        </>
      )}
    </Pressable>
  )
}
