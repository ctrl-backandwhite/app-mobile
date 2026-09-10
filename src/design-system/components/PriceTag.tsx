import { ReactElement } from 'react'
import { View } from 'react-native'

import { Badge } from './Badge'
import { Text } from './Text'

interface Props {
  /** Precio ya formateado por el backend. La aplicación nunca calcula ni da formato a un precio. */
  price: string
  /** Precio anterior, cuando hay rebaja. */
  original?: string
  /** Porcentaje de rebaja, entero y positivo. */
  discountPercent?: number
  /** `lg` para la ficha, `md` para listados y cesta. */
  size?: 'md' | 'lg'
}

/**
 * El precio, con su rebaja si la hay.
 *
 * Va en un componente porque el mismo trío —precio, tachado y porcentaje— aparece en la tarjeta, en
 * la ficha, en la cesta y en el resumen del pedido, y cada copia acababa alineando distinto.
 */
export function PriceTag({ price, original, discountPercent, size = 'md' }: Props): ReactElement {
  /*
   * Los dos datos van juntos o no va ninguno: un tachado sin el porcentaje —o al revés— deja la
   * rebaja a medias y obliga a calcularla de cabeza. Es una regla que ya traía la tarjeta del
   * catálogo y que aquí se respeta igual.
   */
  const onSale = Boolean(original) && discountPercent != null && discountPercent > 0

  return (
    <View className="flex-row flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <Text variant={size === 'lg' ? 'title' : 'price'}>{price}</Text>
      {onSale ? (
        <>
          <Text variant="caption" tone="muted" className="line-through">
            {original}
          </Text>
          {/* Latón: la rebaja es dinero que el revendedor se ahorra. */}
          <Badge tone="accent" label={`−${discountPercent} %`} />
        </>
      ) : null}
    </View>
  )
}
