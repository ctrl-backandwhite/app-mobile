import { ReactElement } from 'react'
import { Pressable, ScrollView, Text } from 'react-native'

/**
 * Lo mínimo que la píldora necesita pintar.
 *
 * Se declara aquí, y no se importa la entidad de categoría, para que el componente sirva igual a una
 * categoría del catálogo que a cualquier otra lista de filtros con nombre.
 */
export interface CategoryChipItem {
  id: string
  name: string
}

interface Props {
  categories: readonly CategoryChipItem[]
  selectedId?: string
  onSelect: (id: string) => void
}

export function CategoryChips({ categories, selectedId, onSelect }: Props): ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-5"
    >
      {categories.map((category: CategoryChipItem): ReactElement => {
        const selected = category.id === selectedId

        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityLabel={category.name}
            accessibilityState={{ selected }}
            onPress={() => onSelect(category.id)}
            className={`h-9 items-center justify-center rounded-selector px-3.5 ${
              selected ? 'bg-primary' : 'border border-base-300 bg-base-100'
            }`}
          >
            <Text
              className={`text-[13px] ${selected ? 'font-medium text-primary-content' : 'text-base-content'}`}
            >
              {category.name}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
