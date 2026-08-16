import { ReactElement } from 'react'
import { Text, View } from 'react-native'

import { PriceTier } from '@features/catalog/domain/entities/product-detail'

interface Props {
  tiers: readonly PriceTier[]
  /**
   * Tramo a resaltar, ya resuelto por `priceTierFor` en el dominio.
   *
   * Se recibe en vez de calcularlo aquí a partir de la cantidad: tener la misma regla escrita dos
   * veces garantiza que un día se cambie una y no la otra, y entonces la tabla resaltaría un precio
   * distinto del que se cobra.
   */
  highlighted?: PriceTier
}

function rangeLabel(tier: PriceTier): string {
  return tier.maxQty === undefined
    ? `desde ${tier.minQty} uds.`
    : `${tier.minQty} – ${tier.maxQty} uds.`
}

export function PriceTierTable({ tiers, highlighted }: Props): ReactElement | null {
  if (tiers.length === 0) {
    return null
  }

  const sorted = [...tiers].sort((a: PriceTier, b: PriceTier): number => a.minQty - b.minQty)
  const active = highlighted

  return (
    <View className="gap-2">
      <Text className="text-[12px] text-base-content opacity-70">Precio por cantidad</Text>

      <View className="overflow-hidden rounded-box border border-base-300">
        {sorted.map((tier: PriceTier, position: number): ReactElement => {
          const selected = active !== undefined && active.minQty === tier.minQty

          return (
            <View
              key={tier.minQty}
              testID={`price-tier-${tier.minQty}`}
              accessibilityState={{ selected }}
              accessibilityLabel={`${rangeLabel(tier)}${
                tier.unitPriceFormatted ? `, ${tier.unitPriceFormatted} por unidad` : ''
              }`}
              className={`flex-row items-center justify-between px-3 py-2.5 ${
                position > 0 ? 'border-t border-base-300' : ''
              } ${selected ? 'bg-primary/10' : 'bg-base-100'}`}
            >
              <Text
                className={`text-[13px] ${
                  selected ? 'font-medium text-primary' : 'text-base-content opacity-70'
                }`}
              >
                {rangeLabel(tier)}
              </Text>
              {/* El importe llega ya formateado por el backend: aquí no se convierte ni se calcula. */}
              <Text
                className={`text-[14px] ${
                  selected ? 'font-medium text-primary' : 'text-base-content'
                }`}
              >
                {tier.unitPriceFormatted ?? '—'}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
