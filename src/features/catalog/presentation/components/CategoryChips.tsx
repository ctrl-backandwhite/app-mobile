import { ReactElement } from 'react'
import { ScrollView } from 'react-native'

import { Chip } from '@ds/components'

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
      {categories.map(
        (category: CategoryChipItem): ReactElement => (
          <Chip
            key={category.id}
            label={category.name}
            selected={category.id === selectedId}
            onPress={() => onSelect(category.id)}
          />
        ),
      )}
    </ScrollView>
  )
}
