import { ReactElement } from 'react'
import { TextInput, View } from 'react-native'

import { colors } from '@ds/tokens'

interface Props {
  value: string
  onChangeText: (value: string) => void
  onSubmit: () => void
  placeholder?: string
}

/** Lupa dibujada con vistas, como el ojo de `PasswordField`: no hay familia de iconos instalada. */
function SearchMark(): ReactElement {
  return (
    <View className="h-4 w-4 opacity-60">
      <View className="absolute left-0 top-0 h-3 w-3 rounded-full border border-base-content" />
      {/* Giro negativo: una línea vertical girada −45° apunta abajo a la derecha, que es el mango. */}
      <View className="absolute bottom-0 right-0 h-[7px] w-px -rotate-45 bg-base-content" />
    </View>
  )
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Buscar productos',
}: Props): ReactElement {
  return (
    <View>
      <TextInput
        accessibilityLabel="Buscar productos"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        // El texto no puede pasar por debajo de la lupa; el resto del estilo va por className.
        style={{ paddingLeft: 38 }}
        className="h-12 rounded-field border border-base-300 bg-base-100 pr-3 text-[15px] text-base-content"
      />
      <View className="absolute bottom-0 left-3 top-0 justify-center">
        <SearchMark />
      </View>
    </View>
  )
}
