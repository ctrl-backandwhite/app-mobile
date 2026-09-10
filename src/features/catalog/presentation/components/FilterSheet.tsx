import { ReactElement, useState } from 'react'
import { View } from 'react-native'

import { Button, Checkbox, OptionRow, Sheet, Text, TextField } from '@ds/components'
import { ProductFilters, ProductSort } from '@features/catalog/domain/entities/filters'

interface Props {
  visible: boolean
  onClose: () => void
  /** Filtros aplicados ahora mismo. La hoja parte de ellos y solo los devuelve al aceptar. */
  value: ProductFilters
  onApply: (filters: ProductFilters) => void
}

/**
 * Criterios de orden, con el nombre que usa quien compra para revender.
 *
 * «Mejor coincidencia» es el orden natural del buscador y por eso encabeza; el resto responde a la
 * pregunta con la que se entra al catálogo: qué se vende, qué es nuevo y qué sale barato.
 */
const ORDENES: readonly { value: ProductSort; label: string; description: string }[] = [
  { value: 'best_match', label: 'Mejor coincidencia', description: 'Lo que más encaja con tu búsqueda' },
  { value: 'sales', label: 'Más vendidos', description: 'Por ventas del último mes' },
  { value: 'trending', label: 'Demanda al alza', description: 'Lo que está subiendo ahora' },
  { value: 'newest', label: 'Novedades', description: 'Lo último catalogado' },
  { value: 'price_asc', label: 'Precio: de menor a mayor', description: 'Para tantear el margen' },
  { value: 'price_desc', label: 'Precio: de mayor a menor', description: 'Para el catálogo premium' },
  { value: 'rating', label: 'Mejor valorados', description: 'Por opinión de compradores' },
]

/** Valoración mínima. Por debajo de tres estrellas no hay criterio útil que ofrecer. */
const VALORACIONES: readonly { value: number | undefined; label: string }[] = [
  { value: undefined, label: 'Cualquiera' },
  { value: 4.5, label: 'Desde 4,5 estrellas' },
  { value: 4, label: 'Desde 4 estrellas' },
  { value: 3, label: 'Desde 3 estrellas' },
]

/** Convierte lo tecleado en número, o en nada. Un campo vacío no es un cero: es «sin límite». */
function toAmount(text: string): number | undefined {
  const clean = text.replace(',', '.').trim()
  if (clean.length === 0) return undefined
  const parsed = Number(clean)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

export function FilterSheet({ visible, onClose, value, onApply }: Props): ReactElement {
  /*
   * La `key` fuerza el remontaje al abrir y al cerrar, así que los valores iniciales del formulario
   * se recalculan solos desde los filtros aplicados. Sincronizarlos con un efecto obligaba a poner
   * estado dentro del efecto —renders en cascada— para resolver algo que el ciclo de vida ya hace.
   */
  return (
    <Filtros
      key={visible ? 'abierta' : 'cerrada'}
      visible={visible}
      value={value}
      onApply={onApply}
      onClose={onClose}
    />
  )
}

interface FiltrosProps {
  visible: boolean
  value: ProductFilters
  onApply: (filters: ProductFilters) => void
  onClose: () => void
}

function Filtros({ visible, value, onApply, onClose }: FiltrosProps): ReactElement {
  const [sort, setSort] = useState<ProductSort>(value.sort ?? 'best_match')
  const [minPrice, setMinPrice] = useState(value.minPrice?.toString() ?? '')
  const [maxPrice, setMaxPrice] = useState(value.maxPrice?.toString() ?? '')
  const [hasVideo, setHasVideo] = useState(Boolean(value.hasVideo))
  const [minRating, setMinRating] = useState<number | undefined>(value.minRating)

  function apply(): void {
    onApply({
      ...value,
      sort,
      minPrice: toAmount(minPrice),
      maxPrice: toAmount(maxPrice),
      hasVideo: hasVideo ? true : undefined,
      minRating,
    })
    onClose()
  }

  function reset(): void {
    setSort('best_match')
    setMinPrice('')
    setMaxPrice('')
    setHasVideo(false)
    setMinRating(undefined)
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Ordenar y filtrar"
      // El pie va fijo: es donde está la acción, y dentro del desplazamiento obligaba a bajar toda
      // la lista de criterios para poder aplicar lo que ya se había elegido arriba.
      footer={
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button title="Quitar filtros" onPress={reset} variant="outline" />
          </View>
          <View className="flex-[1.4]">
            <Button title="Ver resultados" onPress={apply} testID="filtros-aplicar" />
          </View>
        </View>
      }
    >
      <Text variant="eyebrow" tone="muted" className="pb-1 pt-2">
        Ordenar por
      </Text>
      {ORDENES.map((option) => (
        <OptionRow
          key={option.value}
          label={option.label}
          description={option.description}
          selected={sort === option.value}
          onPress={() => setSort(option.value)}
        />
      ))}

      <Text variant="eyebrow" tone="muted" className="pb-2 pt-6">
        Precio de coste
      </Text>
      <View className="flex-row items-end gap-3">
        <View className="flex-1">
          <TextField
            label="Desde"
            value={minPrice}
            onChangeText={setMinPrice}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>
        <View className="flex-1">
          <TextField
            label="Hasta"
            value={maxPrice}
            onChangeText={setMaxPrice}
            keyboardType="decimal-pad"
            placeholder="Sin límite"
          />
        </View>
      </View>

      <Text variant="eyebrow" tone="muted" className="pb-1 pt-6">
        Valoración
      </Text>
      {VALORACIONES.map((option) => (
        <OptionRow
          key={option.label}
          label={option.label}
          selected={minRating === option.value}
          onPress={() => setMinRating(option.value)}
        />
      ))}

      <View className="py-6">
        <Checkbox
          label="Solo productos con vídeo"
          checked={hasVideo}
          onToggle={() => setHasVideo((previous: boolean): boolean => !previous)}
        />
      </View>
    </Sheet>
  )
}
