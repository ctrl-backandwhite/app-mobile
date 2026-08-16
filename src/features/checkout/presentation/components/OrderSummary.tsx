import { ReactElement, ReactNode } from 'react'
import { Text, View } from 'react-native'

import { Alert } from '@ds/components'
import {
  etaLabel,
  hasCustomsLine,
  hasDiscountLine,
  ShippingQuote,
  taxRateLabel,
} from '@features/checkout/domain/entities/shipping'

interface Props {
  /** Cotización viva del backend. Falta antes de elegir destino y mientras se recotiza. */
  quote?: ShippingQuote | null
  loading?: boolean
}

/**
 * Hueco de un importe que todavía no ha dicho el backend.
 *
 * La app no suma, no convierte y no redondea: portes, aduana, impuesto y total salen de la
 * cotización o no se pintan. Un número calculado aquí dejaría de coincidir con el que se cobra en
 * cuanto cambiara el margen o la tasa del día.
 */
const NO_AMOUNT = '—'

function Row({
  label,
  amount,
  hint,
  strong = false,
  tone = 'normal',
}: {
  label: string
  amount?: string
  hint?: string
  strong?: boolean
  tone?: 'normal' | 'positive'
}): ReactElement {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1">
        <Text className={`text-[13px] ${strong ? 'font-medium text-base-content' : 'text-base-content opacity-70'}`}>
          {label}
        </Text>
        {hint ? <Text className="text-[11px] text-base-content opacity-50">{hint}</Text> : null}
      </View>
      <Text
        accessibilityLabel={`${label}: ${amount ?? 'pendiente'}`}
        className={`text-[13px] ${strong ? 'font-medium text-[16px]' : ''} ${
          tone === 'positive' ? 'text-success' : 'text-base-content'
        } ${amount ? '' : 'opacity-40'}`}
      >
        {amount ?? NO_AMOUNT}
      </Text>
    </View>
  )
}

export function OrderSummary({ quote, loading = false }: Props): ReactElement {
  const supported = quote?.supported === true
  const notices: ReactNode[] = []

  if (quote && !quote.supported) {
    notices.push(
      <Alert key="unsupported" variant="warning" message="Todavía no enviamos a ese país." />,
    )
  }
  if (supported && quote?.customsBlocked) {
    notices.push(
      <Alert
        key="blocked"
        variant="error"
        message={`Este pedido supera el límite de importación del destino${
          quote.customsLimit ? ` (${quote.customsLimit})` : ''
        }. Divídelo en pedidos más pequeños.`}
      />,
    )
  }
  if (supported && quote?.customsThresholdExceeded && !quote.customsBlocked) {
    notices.push(
      <Alert
        key="threshold"
        variant="warning"
        message="El pedido pasa por despacho formal de aduana: el envío es más caro y el total ya lo incluye."
      />,
    )
  }
  if (supported && quote?.taxMode === 'DDP' && !quote.customsBlocked) {
    notices.push(
      <Alert
        key="ddp"
        variant="success"
        message="Impuestos incluidos: no pagarás nada al recibir el paquete."
      />,
    )
  }

  return (
    <View className="gap-2" testID="order-summary">
      <Text className="text-[13px] font-medium text-base-content">Resumen</Text>

      <Row label="Subtotal" amount={supported ? quote?.subtotalFormatted : undefined} />

      {hasDiscountLine(quote) ? (
        <Row label="Descuento" amount={quote?.discountFormatted} tone="positive" />
      ) : null}

      <Row
        label="Envío"
        hint={etaLabel(quote)}
        amount={supported ? (quote?.shippingBaseFormatted ?? quote?.shippingFormatted) : undefined}
      />

      {hasCustomsLine(quote) ? (
        <Row label="Aranceles" amount={quote?.customsHandlingFormatted} />
      ) : null}

      {taxRateLabel(quote) ? (
        <Row label={`Impuestos (${taxRateLabel(quote)})`} amount={quote?.taxFormatted} />
      ) : null}

      <View className="mt-1 border-t border-base-300 pt-2">
        <Row label="Total" amount={supported ? quote?.totalFormatted : undefined} strong />
      </View>

      {loading ? (
        <Text className="text-[11px] text-base-content opacity-50">Calculando envío…</Text>
      ) : null}

      {!quote && !loading ? (
        <Text className="text-[11px] text-base-content opacity-60">
          Elige una dirección para conocer el envío y el total.
        </Text>
      ) : null}

      {notices}
    </View>
  )
}
