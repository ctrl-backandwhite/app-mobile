import { Search, X } from 'lucide-react-native'
import { ReactElement } from 'react'
import { Pressable, TextInput, View } from 'react-native'

import { Icon } from '@ds/components'
import { useTheme } from '@ds/tokens'

interface Props {
  value: string
  onChangeText: (value: string) => void
  onSubmit: () => void
  placeholder?: string
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Buscar productos',
}: Props): ReactElement {
  const palette = useTheme()

  return (
    <View className="h-12 flex-row items-center gap-2 rounded-field border border-base-300 bg-base-100 px-3">
      <Icon glyph={Search} size="md" tone="muted" />
      <TextInput
        accessibilityLabel="Buscar productos"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        className="h-12 flex-1 font-light text-body text-base-content"
      />
      {/* Vaciar la búsqueda sin borrar letra a letra: con el teclado abierto es la diferencia entre
          un toque y quince. */}
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Borrar la búsqueda"
          onPress={() => onChangeText('')}
          hitSlop={8}
        >
          <Icon glyph={X} size="md" tone="muted" />
        </Pressable>
      ) : null}
    </View>
  )
}
