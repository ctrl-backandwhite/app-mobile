import { Minus, Plus } from 'lucide-react-native'
import { ReactElement } from 'react'
import { Pressable, View } from 'react-native'

import { Icon, Text } from '@ds/components'

interface Props {
  value: number
  /** Pedido mínimo del producto (MOQ). El contador NUNCA baja de aquí. */
  min: number
  onChange: (value: number) => void
}

export function QuantityStepper({ value, min, onChange }: Props): ReactElement {
  const canDecrease = value > min

  return (
    <View className="h-11 flex-row items-center self-start rounded-field border border-base-300 bg-base-100">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quitar una unidad"
        accessibilityState={{ disabled: !canDecrease }}
        disabled={!canDecrease}
        // El tope se comprueba también aquí, y no solo con `disabled`: el MOQ es una condición del
        // pedido, así que no puede depender de que el botón esté bien pintado.
        onPress={(): void => {
          if (canDecrease) {
            onChange(value - 1)
          }
        }}
        className="h-full w-11 items-center justify-center active:opacity-60"
      >
        <Icon glyph={Minus} size="md" tone={canDecrease ? 'default' : 'muted'} />
      </Pressable>

      <Text
        accessibilityLabel={`Cantidad: ${value}`}
        variant="heading"
        className="min-w-[44px] text-center"
      >
        {value}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Añadir una unidad"
        onPress={(): void => onChange(value + 1)}
        className="h-full w-11 items-center justify-center active:opacity-60"
      >
        <Icon glyph={Plus} size="md" />
      </Pressable>
    </View>
  )
}
