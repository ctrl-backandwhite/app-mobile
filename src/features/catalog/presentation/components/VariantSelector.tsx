import { ReactElement } from 'react'
import { Pressable, View } from 'react-native'

import { RemoteImage, Text } from '@ds/components'

import {
  VariantOption,
  VariantOptionValue,
  VariantSelection,
} from '@features/catalog/domain/entities/product-detail'

interface Props {
  options: readonly VariantOption[]
  selection: VariantSelection
  /** Avisa del eje y del valor elegidos; quien manda decide si suma o reemplaza. */
  onSelect: (optionName: string, value: string) => void
}

/**
 * Un grupo por eje (Color, Talla…). El valor con foto se pinta como miniatura y el resto como
 * píldora: un color se reconoce por la imagen mucho antes que por su nombre en chino traducido.
 */
export function VariantSelector({ options, selection, onSelect }: Props): ReactElement | null {
  const usable = options.filter((option: VariantOption): boolean => option.values.length > 0)
  if (usable.length === 0) {
    return null
  }

  return (
    <View className="gap-4">
      {usable.map((option: VariantOption): ReactElement => {
        const chosen = selection[option.name]

        return (
          <View key={option.id} className="gap-2">
            <View className="flex-row items-center gap-1.5">
              <Text variant="label" tone="muted">{option.name}</Text>
              {chosen ? (
                <Text variant="label">{chosen}</Text>
              ) : null}
            </View>

            <View className="flex-row flex-wrap gap-2">
              {option.values.map((value: VariantOptionValue): ReactElement => {
                const selected = chosen === value.value
                const frame = selected ? 'border-primary border-2' : 'border-base-300 border'

                return value.imageUrl ? (
                  <Pressable
                    key={value.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.name}: ${value.value}`}
                    accessibilityState={{ selected }}
                    onPress={(): void => onSelect(option.name, value.value)}
                    className={`h-16 w-16 overflow-hidden rounded-selector bg-base-200 ${frame}`}
                  >
                    <RemoteImage uri={value.imageUrl} className="h-full w-full" />
                  </Pressable>
                ) : (
                  <Pressable
                    key={value.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.name}: ${value.value}`}
                    accessibilityState={{ selected }}
                    onPress={(): void => onSelect(option.name, value.value)}
                    className={`h-10 min-w-[44px] items-center justify-center rounded-selector bg-base-100 px-3 ${frame}`}
                  >
                    <Text variant="label" tone={selected ? 'primary' : 'default'}>
                      {value.value}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        )
      })}
    </View>
  )
}
