import { ReactElement } from 'react'
import { Text, View } from 'react-native'

import { ProductSpecification } from '@features/catalog/domain/entities/product-detail'

interface Props {
  specifications: readonly ProductSpecification[]
}

export function SpecificationList({ specifications }: Props): ReactElement | null {
  if (specifications.length === 0) {
    return null
  }

  return (
    <View className="overflow-hidden rounded-box border border-base-300">
      {specifications.map((specification: ProductSpecification, position: number): ReactElement => (
        <View
          key={`${specification.key}-${position}`}
          className={`flex-row items-start gap-3 px-3 py-2.5 ${
            position > 0 ? 'border-t border-base-300' : ''
          } ${position % 2 === 1 ? 'bg-base-200' : 'bg-base-100'}`}
        >
          {/* Dos columnas fijas: la clave a un tercio deja la fila alineada aunque los nombres de
              las especificaciones tengan longitudes muy distintas. */}
          <Text className="w-1/3 text-[13px] text-base-content opacity-70">
            {specification.key}
          </Text>
          <Text className="flex-1 text-[13px] text-base-content">{specification.value}</Text>
        </View>
      ))}
    </View>
  )
}
