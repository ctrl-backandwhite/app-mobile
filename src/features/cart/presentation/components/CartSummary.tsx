import { ReactElement } from 'react'
import { Text, View } from 'react-native'

import { Button } from '@ds/components'
import { CartQuote } from '@features/cart/domain/entities/cart-quote'

interface Props {
  /** Presupuesto vivo del backend. Falta en la primera pintada y mientras se recotiza. */
  quote?: CartQuote
  unitCount: number
  onCheckout: () => void
  checkoutDisabled?: boolean
}

const NO_AMOUNT = '—'

export function CartSummary({
  quote,
  unitCount,
  onCheckout,
  checkoutDisabled = false,
}: Props): ReactElement {
  const subtotal = quote?.subtotalFormatted
  /**
   * Sin subtotal el botón queda inerte: tramitar aquí llevaría al usuario a confirmar un pedido
   * cuyo importe la app todavía no conoce, y el precio se le revelaría ya dentro del pago.
   */
  const inert = checkoutDisabled || subtotal == null
  const units = unitCount === 1 ? '1 unidad' : `${unitCount} unidades`

  return (
    // La barra la ancla la pantalla fuera del área con desplazamiento; aquí solo se pinta el borde
    // superior que la separa de la lista.
    <View testID="cart-summary" className="gap-3 border-t border-base-300 bg-base-100 px-4 pb-4 pt-3">
      <View className="flex-row items-end justify-between gap-3">
        <View className="gap-0.5">
          <Text className="text-[11px] text-base-content opacity-60">Subtotal</Text>
          <Text accessibilityLabel={units} className="text-[12px] text-base-content opacity-70">
            {units}
          </Text>
        </View>
        <Text
          testID="cart-summary-subtotal"
          className={`font-medium text-[22px] text-base-content ${subtotal ? '' : 'opacity-40'}`}
        >
          {subtotal ?? NO_AMOUNT}
        </Text>
      </View>

      <Button title="Tramitar pedido" onPress={onCheckout} disabled={inert} />
    </View>
  )
}
