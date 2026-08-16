import { ReactElement } from 'react'
import { Pressable, Text, View } from 'react-native'

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
        className="h-full w-11 items-center justify-center"
      >
        <View className={`h-0.5 w-3.5 ${canDecrease ? 'bg-base-content' : 'bg-base-300'}`} />
      </Pressable>

      <Text
        accessibilityLabel={`Cantidad: ${value}`}
        className="min-w-[44px] text-center font-medium text-[15px] text-base-content"
      >
        {value}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Añadir una unidad"
        onPress={(): void => onChange(value + 1)}
        className="h-full w-11 items-center justify-center"
      >
        <View className="h-3.5 w-3.5 items-center justify-center">
          <View className="absolute h-0.5 w-3.5 bg-base-content" />
          <View className="absolute h-3.5 w-0.5 bg-base-content" />
        </View>
      </Pressable>
    </View>
  )
}
