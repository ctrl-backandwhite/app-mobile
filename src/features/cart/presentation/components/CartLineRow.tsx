import { ReactElement } from 'react'
import { Image, Pressable, Text, View } from 'react-native'

import { CartLine, minimumQuantity } from '@features/cart/domain/entities/cart-line'
import { QuoteLine } from '@features/cart/domain/entities/cart-quote'
import { QuantityStepper } from '@features/catalog/presentation/components/QuantityStepper'

interface Props {
  line: CartLine
  /** Importe recotizado por el backend. Falta mientras el presupuesto está en vuelo. */
  quoteLine?: QuoteLine
  onQuantityChange: (line: CartLine, quantity: number) => void
  onRemove: (line: CartLine) => void
  onSaveForLater: (line: CartLine) => void
}

/**
 * Hueco del importe mientras no hay presupuesto.
 *
 * La app NUNCA multiplica ni suma importes: el margen del canal y la tasa del día los aplica el
 * backend, así que un número calculado aquí dejaría de coincidir con lo que se cobra en cuanto
 * cambie cualquiera de los dos. Antes un guion que un precio que luego se desmiente.
 */
const NO_AMOUNT = '—'

/** Variante y SKU comparten renglón, igual que en el cajón del escritorio. */
function detailOf(line: CartLine): string | null {
  const parts: string[] = []
  if (line.variantLabel) {
    parts.push(line.variantLabel)
  }
  if (line.sku) {
    parts.push(`SKU ${line.sku}`)
  }
  return parts.length > 0 ? parts.join(' · ') : null
}

export function CartLineRow({
  line,
  quoteLine,
  onQuantityChange,
  onRemove,
  onSaveForLater,
}: Props): ReactElement {
  const amount = quoteLine?.lineTotalFormatted
  const detail = detailOf(line)
  // La regla del pedido mínimo vive en el dominio: aquí solo se le pasa al contador.
  const minimum = minimumQuantity(line)

  return (
    <View
      testID={`cart-line-${line.productId}${line.variantId ? `-${line.variantId}` : ''}`}
      className="flex-row gap-3 border-b border-base-200 py-3"
    >
      {line.image ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: line.image }}
          resizeMode="cover"
          className="h-16 w-16 rounded-selector bg-base-200"
        />
      ) : (
        <View className="h-16 w-16 rounded-selector bg-base-200" />
      )}

      <View className="flex-1 gap-1.5">
        <Text numberOfLines={2} className="text-[13px] leading-[18px] text-base-content">
          {line.title}
        </Text>

        {detail ? (
          <Text numberOfLines={1} className="text-[11px] text-base-content opacity-60">
            {detail}
          </Text>
        ) : null}

        <View className="flex-row items-center justify-between gap-3">
          <QuantityStepper
            value={line.quantity}
            min={minimum}
            onChange={(quantity: number): void => onQuantityChange(line, quantity)}
          />
          <Text
            testID="cart-line-amount"
            className={`font-medium text-[15px] text-base-content ${amount ? '' : 'opacity-40'}`}
          >
            {amount ?? NO_AMOUNT}
          </Text>
        </View>

        <View className="flex-row items-center gap-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Guardar ${line.title} para más tarde`}
            onPress={(): void => onSaveForLater(line)}
            className="py-1"
          >
            <Text className="text-[11px] text-primary">Guardar para más tarde</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${line.title} de la cesta`}
            onPress={(): void => onRemove(line)}
            className="py-1"
          >
            <Text className="text-[11px] text-error">Quitar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}
