import { ReactElement } from 'react'
import { View } from 'react-native'

import { Text } from '@ds/components'

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
      <Text variant="eyebrow" tone="muted">
        Precio por cantidad
      </Text>

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
              } ${selected ? 'border-l-4 border-l-accent bg-accent/[0.12]' : 'bg-base-100'}`}
            >
              {/* El latón marca el tramo que aplica desde el FONDO: comprar más baja el precio y eso
                  es dinero, no un estado de la interfaz. Lo escrito encima va en tinta, que es lo que
                  se lee: el latón sobre fondo claro no llega al contraste de un texto pequeño. */}
              <Text variant="label" tone={selected ? 'default' : 'muted'}>
                {rangeLabel(tier)}
              </Text>
              {/* El importe llega ya formateado por el backend: aquí no se convierte ni se calcula. */}
              <Text variant={selected ? 'price' : 'label'}>{tier.unitPriceFormatted ?? '—'}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
